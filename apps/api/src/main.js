import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.js";
import { errorMiddleware } from "./middleware/error.js";
import { globalRateLimit } from "./middleware/global-rate-limit.js";
import logger from "./utils/logger.js";
import { BodyLimit } from "./constants/common.js";

const app = express();

app.set("trust proxy", true);

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
});

process.on("SIGINT", async () => {
  logger.info("Interrupted");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  logger.info("Exiting");
  process.exit();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        workerSrc: ["'self'", "blob:"],
        connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);
// Parse CORS origins from env (comma-separated string to array)
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin)
  : false;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (Array.isArray(corsOrigins) && corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "QUERY"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  }),
);
app.use(morgan("combined"));
app.use(globalRateLimit);
app.use(
  express.json({
    limit: BodyLimit,
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: BodyLimit,
  }),
);

// Test root route directly in main.js
app.get("/", (req, res) => {
  res.json({
    name: "Masjid API",
    version: "1.0.0",
    message: "Root endpoint working!",
  });
});

app.use("/", routes());

app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

const port = process.env.PORT || 3001;
const host = process.env.HOST || "0.0.0.0"; // Listen on all network interfaces

app.listen(port, host, () => {
  logger.info(`🚀 API Server running on http://${host}:${port}`);
});

export default app;
