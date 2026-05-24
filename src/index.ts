import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { logger } from "hono/logger";

import { waitlist } from "./routes/waitlist";
import { contact } from "./routes/contact";
import { analytics } from "./routes/analytics";
import { admin } from "./routes/admin";

const app = new Hono();

// Request logging
app.use("*", logger());

// Security headers on every response
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self'",
  );
});

// CORS for API routes
app.use("/api/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
}));

// Health check
app.get("/api/health", (c) =>
  c.json({ ok: true, uptime: process.uptime() }),
);

// Mount API routes
app.route("/api", waitlist);
app.route("/api", contact);
app.route("/api", analytics);
app.route("/api/admin", admin);

// Static files — serve public/ for everything that isn't an API route
app.use("*", serveStatic({ root: "./public" }));
app.use("*", serveStatic({ root: "./public", path: "index.html" }));

const port = parseInt(process.env.PORT || "3000", 10);

export default {
  fetch: app.fetch,
  port,
};

console.log(`PurpleAILAB server listening on :${port}`);
