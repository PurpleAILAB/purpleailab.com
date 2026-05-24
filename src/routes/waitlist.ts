import { Hono } from "hono";
import { addWaitlist, waitlistExists } from "../db";
import { rateLimit } from "../middleware/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const waitlist = new Hono();

waitlist.post(
  "/waitlist",
  rateLimit(60_000, 5),
  async (c) => {
    let body: { email?: string; source?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "Invalid JSON body." }, 400);
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_RE.test(email)) {
      return c.json({ ok: false, error: "A valid email address is required." }, 400);
    }

    if (waitlistExists(email)) {
      return c.json({ ok: false, error: "This email is already on the waitlist." }, 409);
    }

    const source = typeof body.source === "string" && body.source.trim()
      ? body.source.trim()
      : "website";

    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
      c.req.header("x-real-ip") ||
      null;

    try {
      addWaitlist(email, source, ip);
    } catch {
      return c.json({ ok: false, error: "Failed to save. Please try again." }, 500);
    }

    return c.json({ ok: true, message: "You're on the list!" }, 201);
  },
);

export { waitlist };
