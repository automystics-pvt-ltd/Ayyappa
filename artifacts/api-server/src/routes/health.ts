import path from "node:path";
import fs from "node:fs";
import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

/**
 * GET /api/bundle-dl?token=<BUNDLE_DL_TOKEN>
 *
 * Downloads the built dist/index.mjs so the production server can pull the
 * latest build directly from the running Replit dev instance.
 *
 * Protected by BUNDLE_DL_TOKEN secret — requests without a valid token get 401.
 * Only available outside production (NODE_ENV !== "production").
 */
router.get("/bundle-dl", (req: Request, res: Response) => {
  if (process.env["NODE_ENV"] === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const token = process.env["BUNDLE_DL_TOKEN"];
  if (!token) {
    res.status(503).json({ error: "BUNDLE_DL_TOKEN secret not configured" });
    return;
  }

  const provided = (req.query["token"] as string) ?? req.headers["x-bundle-token"];
  if (provided !== token) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  // The server runs as: node ./dist/index.mjs from the artifacts/api-server dir
  const bundlePath = path.resolve(process.cwd(), "dist", "index.mjs");
  if (!fs.existsSync(bundlePath)) {
    res.status(404).json({ error: "Bundle not built yet" });
    return;
  }

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Content-Disposition", 'attachment; filename="index.mjs"');
  res.sendFile(bundlePath);
});

export default router;
