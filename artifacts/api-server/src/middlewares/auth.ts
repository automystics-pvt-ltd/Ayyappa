import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.adminId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Confirm the admin still exists in the DB (catches deleted-account sessions)
  try {
    const [admin] = await db
      .select({ id: adminsTable.id })
      .from(adminsTable)
      .where(eq(adminsTable.id, session.adminId))
      .limit(1);

    if (!admin) {
      session.destroy(() => {});
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } catch {
    res.status(500).json({ error: "Session validation failed" });
    return;
  }

  next();
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session?.adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Confirm the admin still exists in the DB
    try {
      const [admin] = await db
        .select({ id: adminsTable.id, role: adminsTable.role })
        .from(adminsTable)
        .where(eq(adminsTable.id, session.adminId))
        .limit(1);

      if (!admin) {
        session.destroy(() => {});
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
    } catch {
      res.status(500).json({ error: "Session validation failed" });
      return;
    }

    if (!roles.includes(session.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
