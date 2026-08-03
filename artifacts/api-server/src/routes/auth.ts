import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, pool } from "@workspace/db";
import { adminsTable, auditLogsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// All /api/auth/* responses must never be cached — they depend on session state.
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  try {
    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.username, username))
      .limit(1);

    if (!admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Update last login
    await db
      .update(adminsTable)
      .set({ lastLogin: new Date() })
      .where(eq(adminsTable.id, admin.id));

    // Set session
    const session = (req as any).session;
    session.adminId = admin.id;
    session.role = admin.role;
    session.displayName = admin.displayName;

    res.json({ id: admin.id, username: admin.username, role: admin.role, displayName: admin.displayName });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  (req as any).session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me — public; returns { admin: null } when not logged in
// Must never be cached — the response depends on session state which changes on login/logout.
router.get("/me", async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const session = (req as any).session;
  if (!session?.adminId) {
    res.json({ admin: null });
    return;
  }
  res.json({
    admin: {
      adminId: session.adminId,
      role: session.role,
      displayName: session.displayName,
    },
  });
});

// POST /api/auth/create-admin (super_admin only, or first time setup)
router.post("/create-admin", requireAuth, async (req, res) => {
  const session = (req as any).session;
  if (session.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can create admins" });
    return;
  }

  const { username, password, role, displayName } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [admin] = await db
      .insert(adminsTable)
      .values({ username, passwordHash, role: role || "editor", displayName })
      .returning();
    res.json({ id: admin.id, username: admin.username, role: admin.role });
  } catch (err: any) {
    if (err.code === "23505") {
      res.status(409).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: "Failed to create admin" });
    }
  }
});

// GET /api/auth/admins — list all admins (super_admin only)
router.get("/admins", requireAuth, async (req, res) => {
  const session = (req as any).session;
  if (session.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can list admins" });
    return;
  }
  try {
    const admins = await db
      .select({
        id: adminsTable.id,
        username: adminsTable.username,
        role: adminsTable.role,
        displayName: adminsTable.displayName,
        createdAt: adminsTable.createdAt,
        lastLogin: adminsTable.lastLogin,
      })
      .from(adminsTable)
      .orderBy(adminsTable.createdAt);
    res.json(admins);
  } catch {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

// PATCH /api/auth/admins/:id — update role / displayName (super_admin only)
router.patch("/admins/:id", requireAuth, async (req, res) => {
  const session = (req as any).session;
  if (session.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can update admins" });
    return;
  }
  const targetId = Number(req.params.id);
  if (targetId === session.adminId) {
    res.status(400).json({ error: "Cannot modify your own account here" });
    return;
  }
  const { role, displayName } = req.body;
  const allowed = ["super_admin", "editor", "volunteer"];
  if (role && !allowed.includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  try {
    const updates: Record<string, unknown> = {};
    if (role) updates.role = role;
    if (displayName !== undefined) updates.displayName = displayName;
    const [updated] = await db
      .update(adminsTable)
      .set(updates)
      .where(eq(adminsTable.id, targetId))
      .returning({ id: adminsTable.id, username: adminsTable.username, role: adminsTable.role, displayName: adminsTable.displayName });
    if (!updated) { res.status(404).json({ error: "Admin not found" }); return; }
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update admin" });
  }
});

// DELETE /api/auth/admins/:id (super_admin only, cannot delete self)
router.delete("/admins/:id", requireAuth, async (req, res) => {
  const session = (req as any).session;
  if (session.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can delete admins" });
    return;
  }
  const targetId = Number(req.params.id);
  if (targetId === session.adminId) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  try {
    await db.delete(adminsTable).where(eq(adminsTable.id, targetId));
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

// PATCH /api/auth/admins/:id/reset-password (super_admin only, cannot reset own)
router.patch("/admins/:id/reset-password", requireAuth, async (req, res) => {
  const session = (req as any).session;
  if (session.role !== "super_admin") {
    res.status(403).json({ error: "Only super_admin can reset passwords" });
    return;
  }
  const targetId = Number(req.params.id);
  if (targetId === session.adminId) {
    res.status(400).json({ error: "Use change-password to update your own password" });
    return;
  }
  const { newPassword } = req.body;
  if (!newPassword) {
    res.status(400).json({ error: "New password is required" });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  try {
    const [admin] = await db
      .select({ id: adminsTable.id, username: adminsTable.username })
      .from(adminsTable)
      .where(eq(adminsTable.id, targetId))
      .limit(1);
    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(adminsTable).set({ passwordHash }).where(eq(adminsTable.id, targetId));

    // Invalidate all active sessions for the target user
    await pool.query(
      `DELETE FROM sessions WHERE sess->>'adminId' = $1`,
      [String(targetId)]
    );

    // Audit log
    await db.insert(auditLogsTable).values({
      adminId: session.adminId,
      action: "reset_password",
      entityType: "admin",
      entityId: targetId,
      details: { targetUsername: admin.username },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// PATCH /api/auth/change-password
router.patch("/change-password", requireAuth, async (req, res) => {
  const session = (req as any).session;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" });
    return;
  }

  try {
    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.id, session.adminId))
      .limit(1);

    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(adminsTable)
      .set({ passwordHash })
      .where(eq(adminsTable.id, admin.id));

    // Audit log
    await db.insert(auditLogsTable).values({
      adminId: admin.id,
      action: "change_password",
      entityType: "admin",
      entityId: admin.id,
      details: { username: admin.username },
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

export default router;
