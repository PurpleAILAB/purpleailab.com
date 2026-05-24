import { Hono } from "hono";
import type { Context, MiddlewareHandler } from "hono";
import { getWaitlist, getContacts, getStats, getAllWaitlistEmails } from "../db";

function requireAuth(): MiddlewareHandler {
  return async (c: Context, next) => {
    const token = process.env.ADMIN_TOKEN;
    if (!token) {
      return c.json({ ok: false, error: "Admin access is not configured." }, 503);
    }

    const auth = c.req.header("authorization");
    if (!auth || auth !== `Bearer ${token}`) {
      return c.json({ ok: false, error: "Unauthorized." }, 401);
    }

    await next();
  };
}

const admin = new Hono();

admin.use("/*", requireAuth());

admin.get("/waitlist", (c) => {
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "50", 10) || 50, 1), 500);
  const offset = Math.max(parseInt(c.req.query("offset") || "0", 10) || 0, 0);
  const rows = getWaitlist(limit, offset);
  return c.json({ ok: true, data: rows, limit, offset });
});

admin.get("/contacts", (c) => {
  const limit = Math.min(Math.max(parseInt(c.req.query("limit") || "50", 10) || 50, 1), 500);
  const offset = Math.max(parseInt(c.req.query("offset") || "0", 10) || 0, 0);
  const rows = getContacts(limit, offset);
  return c.json({ ok: true, data: rows, limit, offset });
});

admin.get("/stats", (c) => {
  const stats = getStats();
  return c.json({ ok: true, data: stats });
});

admin.get("/export/waitlist", (c) => {
  const rows = getAllWaitlistEmails();
  const header = "email,source,created_at";
  const lines = rows.map(
    (r) => `${csvEscape(r.email)},${csvEscape(r.source)},${csvEscape(r.created_at)}`,
  );
  const csv = [header, ...lines].join("\n");

  c.header("Content-Type", "text/csv; charset=utf-8");
  c.header("Content-Disposition", 'attachment; filename="waitlist.csv"');
  return c.body(csv);
});

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export { admin };
