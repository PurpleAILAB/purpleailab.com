import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";

let _db: Database | null = null;

function getDb(): Database {
  if (_db) return _db;

  mkdirSync("data", { recursive: true });

  const db = new Database("data/purpleailab.db", { create: true });
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");

  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'website',
      ip TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      message TEXT NOT NULL,
      ip TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      referrer TEXT,
      ip TEXT,
      ua TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  _db = db;
  return db;
}

export function waitlistExists(email: string): boolean {
  const row = getDb()
    .query("SELECT 1 FROM waitlist WHERE email = ?")
    .get(email);
  return row !== null;
}

export function addWaitlist(
  email: string,
  source: string,
  ip: string | null,
): void {
  getDb()
    .query("INSERT INTO waitlist (email, source, ip) VALUES (?, ?, ?)")
    .run(email, source, ip);
}

export function addContact(
  name: string,
  email: string,
  company: string | null,
  message: string,
  ip: string | null,
): void {
  getDb()
    .query(
      "INSERT INTO contacts (name, email, company, message, ip) VALUES (?, ?, ?, ?, ?)",
    )
    .run(name, email, company, message, ip);
}

export function trackView(
  path: string,
  referrer: string | null,
  ip: string | null,
  ua: string | null,
): void {
  getDb()
    .query(
      "INSERT INTO page_views (path, referrer, ip, ua) VALUES (?, ?, ?, ?)",
    )
    .run(path, referrer, ip, ua);
}

export function getWaitlist(
  limit: number,
  offset: number,
): { id: number; email: string; source: string; ip: string | null; created_at: string }[] {
  return getDb()
    .query("SELECT id, email, source, ip, created_at FROM waitlist ORDER BY id DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as any;
}

export function getContacts(
  limit: number,
  offset: number,
): { id: number; name: string; email: string; company: string | null; message: string; ip: string | null; created_at: string }[] {
  return getDb()
    .query("SELECT id, name, email, company, message, ip, created_at FROM contacts ORDER BY id DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as any;
}

export function getStats(): {
  waitlist_count: number;
  contacts_count: number;
  views_count: number;
  recent_signups: { email: string; created_at: string }[];
} {
  const db = getDb();
  const wc = db.query("SELECT count(*) as c FROM waitlist").get() as { c: number };
  const cc = db.query("SELECT count(*) as c FROM contacts").get() as { c: number };
  const vc = db.query("SELECT count(*) as c FROM page_views").get() as { c: number };
  const recent = db
    .query("SELECT email, created_at FROM waitlist ORDER BY id DESC LIMIT 10")
    .all() as { email: string; created_at: string }[];

  return {
    waitlist_count: wc.c,
    contacts_count: cc.c,
    views_count: vc.c,
    recent_signups: recent,
  };
}

export function getAllWaitlistEmails(): { email: string; source: string; created_at: string }[] {
  return getDb()
    .query("SELECT email, source, created_at FROM waitlist ORDER BY id ASC")
    .all() as any;
}
