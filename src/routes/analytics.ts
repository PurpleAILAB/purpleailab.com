import { Hono } from "hono";
import { trackView } from "../db";
import { rateLimit } from "../middleware/rateLimit";

const analytics = new Hono();

analytics.post(
  "/track",
  rateLimit(60_000, 30),
  async (c) => {
    let body: { path?: string; referrer?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.body(null, 204);
    }

    const path = typeof body.path === "string" ? body.path.trim() : "";
    if (!path) return c.body(null, 204);

    const referrer = typeof body.referrer === "string" && body.referrer.trim()
      ? body.referrer.trim()
      : null;

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      null;

    const ua = c.req.header("user-agent") || null;

    trackView(path, referrer, ip, ua);

    return c.body(null, 204);
  },
);

export { analytics };
