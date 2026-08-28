import { Router } from "express";
import healthCheck from "./health-check.js";
import { jadwal, kota } from "./sholat.js";

export default () => {
  const router = Router();

  // Debug logging
  router.use((req, res, next) => {
    console.log(`[ROUTE] ${req.method} ${req.path}`);
    next();
  });

  // Root endpoint - API information
  router.get("/", (req, res) => {
    console.log("[ROUTE HIT] GET /");
    res.json({
      name: "Masjid API",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        prayerTimes: "/sholat/jadwal",
        cities: "/sholat/kota",
      },
    });
  });

  // Health check
  router.get("/health", healthCheck);

  // Prayer times endpoints
  router.get("/sholat/jadwal", jadwal);
  router.get("/sholat/kota", kota);

  return router;
};
