import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import donationsRouter from "./donations";
import newsRouter from "./news";
import eventsRouter from "./events";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";

const router = Router();

// Mount health router at root so /healthz stays at /api/healthz (no prefix change)
router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/donations", donationsRouter);
router.use("/news", newsRouter);
router.use("/events", eventsRouter);
router.use("/settings", settingsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
