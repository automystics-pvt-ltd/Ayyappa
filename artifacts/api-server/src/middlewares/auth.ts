import type { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session;
  if (!session?.adminId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = (req as any).session;
    if (!session?.adminId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(session.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
