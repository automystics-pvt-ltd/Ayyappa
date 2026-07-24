import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import donationsRouter from "./donations";
import newsRouter from "./news";
import eventsRouter from "./events";
import settingsRouter from "./settings";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";
import galleryRouter from "./gallery";

const router = Router();

// Mount health router at root so /healthz stays at /api/healthz
router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/donations", donationsRouter);
router.use("/news", newsRouter);
router.use("/events", eventsRouter);
router.use("/settings", settingsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/gallery", galleryRouter);
router.use("/", storageRouter);

export default router;
