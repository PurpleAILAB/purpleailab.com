import { Hono } from "hono";
import { addContact } from "../db";
import { rateLimit } from "../middleware/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const contact = new Hono();

contact.post(
  "/contact",
  rateLimit(60_000, 3),
  async (c) => {
    let body: { name?: string; email?: string; company?: string; message?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "Invalid JSON body." }, 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const company = typeof body.company === "string" && body.company.trim()
      ? body.company.trim()
      : null;

    if (!name) {
      return c.json({ ok: false, error: "Name is required." }, 400);
    }
    if (!email || !EMAIL_RE.test(email)) {
      return c.json({ ok: false, error: "A valid email address is required." }, 400);
    }
    if (!message) {
      return c.json({ ok: false, error: "Message is required." }, 400);
    }

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      null;

    try {
      addContact(name, email, company, message, ip);
    } catch {
      return c.json({ ok: false, error: "Failed to save. Please try again." }, 500);
    }

    return c.json({ ok: true }, 201);
  },
);

export { contact };
