import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

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

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  const session = (req as any).session;
  res.json({ adminId: session.adminId, role: session.role, displayName: session.displayName });
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

export default router;
