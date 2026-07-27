import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

// Require SESSION_SECRET — no insecure fallback
const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error(
    "SESSION_SECRET environment variable is required. Set it as a Replit Secret."
  );
}

const app: Express = express();

// Trust the first proxy so Express reads X-Forwarded-Proto correctly,
// which lets secure session cookies be set behind Replit's HTTPS proxy.
app.set("trust proxy", 1);

const PgSession = connectPgSimple(session);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// Build an explicit allowlist of trusted origins.
// In production, set ALLOWED_ORIGINS to a comma-separated list of allowed origins,
// e.g. "https://vadamadurai-ayyappan-temple.automystics.tech"
const replitDevDomain = process.env["REPLIT_DEV_DOMAIN"];
const extraOrigins = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = new Set<string>([
  // Only this repl's own preview domain
  ...(replitDevDomain ? [`https://${replitDevDomain}`] : []),
  // Local dev fallbacks
  "http://localhost:5173",
  "http://localhost:3000",
  // Production / custom domains set via env var
  ...extraOrigins,
]);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin requests (browser sends no Origin) are always allowed
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

const isProduction = process.env["NODE_ENV"] === "production";

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "sessions",
      // createTableIfMissing reads a .sql file at runtime which breaks when
      // the app is bundled. Create the table manually via deploy/schema.sql instead.
      createTableIfMissing: false,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // With trust proxy set, Express correctly honours X-Forwarded-Proto
      // and will only send the cookie over HTTPS in production.
      secure: isProduction,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

app.use("/api", router);

// CORS violation → 403, not 500
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.message?.startsWith("CORS:")) {
    res.status(403).json({ error: err.message });
    return;
  }
  next(err);
});

export default app;
