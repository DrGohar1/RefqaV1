import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.set("trust proxy", 1);

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
  }),
);

// CORS — allow frontend origin in production
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"]
  : true;

app.use(cors({ credentials: true, origin: allowedOrigins }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ── Session Store ──────────────────────────────────────────────────────────
// Use PostgreSQL-backed sessions for Vercel (stateless serverless) and production.
// Falls back to memory store in development if DATABASE_URL is absent.
let sessionStore: session.Store | undefined;

if (process.env.DATABASE_URL) {
  try {
    const { default: connectPgSimple } = await import("connect-pg-simple");
    const PgSession = connectPgSimple(session);
    sessionStore = new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "user_sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 60, // prune expired sessions every hour
    });
  } catch (err) {
    logger.warn({ err }, "connect-pg-simple failed — falling back to memory store");
  }
}

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "rafaqaa-dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    name: "rafaqaa.sid",
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// ── Static uploads ─────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/api/uploads", express.static(uploadsDir));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api", router);

// ── Health check at root (for Vercel / uptime monitors) ───────────────────
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "Rafaqaa API", env: process.env.NODE_ENV });
});

export default app;
