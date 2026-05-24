import type { Context, MiddlewareHandler } from "hono";

interface RateEntry {
  count: number;
  resetAt: number;
}

export function rateLimit(windowMs: number, maxRequests: number): MiddlewareHandler {
  const clients = new Map<string, RateEntry>();

  // Sweep expired entries every 60s
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key);
    }
  }, 60_000).unref();

  return async (c: Context, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const entry = clients.get(ip);

    if (!entry || entry.resetAt <= now) {
      clients.set(ip, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (entry.count >= maxRequests) {
      c.status(429);
      return c.json({
        ok: false,
        error: "Too many requests. Please try again later.",
      });
    }

    entry.count++;
    await next();
  };
}
