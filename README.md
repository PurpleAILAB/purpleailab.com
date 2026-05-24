# purpleailab.com

Marketing website for **Purple AI LAB** — cybersecurity company building AI-powered deception technology.

## Overview

Production website with:
- Waitlist signup (email collection with dedup)
- Contact form (name, email, company, message)
- Page view analytics (path, referrer, user-agent)
- Admin API for data export
- Static frontend served from `public/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) |
| Database | SQLite via `bun:sqlite` |
| Frontend | HTML/CSS/JS, Three.js |
| Deployment | Docker |

## Quick Start

```bash
bun install
cp .env.example .env
bun dev
```

The server starts at `http://localhost:3000`.

## Docker Deployment

```bash
cp .env.example .env
# Edit .env — set a strong ADMIN_TOKEN

docker compose up -d
```

The container exposes port `3000`. The `data/` directory is mounted as a volume for SQLite persistence.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP listen port |
| `ADMIN_TOKEN` | Yes | — | Bearer token for admin API routes |

## API Reference

### Public Endpoints

#### `GET /api/health`
Health check. Returns `{ "status": "ok" }`.

#### `POST /api/waitlist`
Add an email to the waitlist.

**Body:**
```json
{ "email": "user@example.com" }
```

**Responses:**
- `201` — `{ "message": "Added to waitlist" }`
- `400` — invalid email
- `409` — email already registered
- `429` — rate limited

#### `POST /api/contact`
Submit a contact form.

**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Acme Corp",
  "message": "Interested in your platform."
}
```

**Responses:**
- `201` — `{ "message": "Message received" }`
- `400` — missing required fields
- `429` — rate limited

#### `POST /api/track`
Record a page view.

**Body:**
```json
{ "path": "/", "referrer": "https://google.com" }
```

**Response:** `204` No Content

### Admin Endpoints

All admin routes require the `Authorization: Bearer <ADMIN_TOKEN>` header.

#### `GET /api/admin/waitlist`
List all waitlist entries. Supports `?limit=` and `?offset=` query params.

#### `GET /api/admin/contacts`
List all contact form submissions. Supports `?limit=` and `?offset=`.

#### `GET /api/admin/analytics`
Page view analytics. Supports `?limit=`, `?offset=`, and `?path=` filter.

#### `GET /api/admin/stats`
Dashboard summary — total waitlist signups, contacts, and page views.

## Project Structure

```
purpleailab.com/
├── src/
│   ├── index.ts          # Entry point — Bun.serve() + Hono
│   ├── db.ts             # SQLite schema & queries
│   ├── routes/
│   │   ├── health.ts     # GET /api/health
│   │   ├── waitlist.ts   # POST /api/waitlist
│   │   ├── contact.ts    # POST /api/contact
│   │   ├── track.ts      # POST /api/track
│   │   └── admin.ts      # GET /api/admin/*
│   └── middleware/
│       ├── rate-limit.ts  # Sliding window rate limiter
│       └── auth.ts        # Bearer token auth
├── public/               # Static frontend files
├── data/                 # SQLite database (gitignored)
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## License

[Apache License 2.0](LICENSE) — Copyright 2026 Purple AI LAB AS
