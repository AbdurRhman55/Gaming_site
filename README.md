# Parking Fury Guide — PHP + MySQL edition

The complete gaming site rebuilt as plain **HTML + CSS + JavaScript + PHP + MySQL** so it
runs on ordinary shared hosting (Hostinger) with no build step, no Node on the server,
and no VPS. Publishing a game in the dashboard makes it live instantly — PHP renders
every page on request.

The original Astro version stays in this repository's git history (commit `1a089e8`).

---

## What's inside

| Path | Purpose |
|---|---|
| `index.php`, `about.php`, … | The 11 editorial pages + homepage (body markup ported verbatim from the production build) |
| `games/` | Library (`/games/`) and the in-site player (`/games/{slug}/`) |
| `admin/` | Operator console: dashboard, analytics, SEO audit |
| `api/` | JSON endpoints: analytics beacon, login, games CRUD, cover upload |
| `includes/` | App core: config, DB, SEO registry, layout, auth, analytics |
| `assets/` | CSS (tailwind layer + original design system) and game/admin scripts |
| `uploads/` | Game cover images (served statically) |
| `embed/` | Two thin, noindex mini-game embed documents |
| `database.sql` | MySQL seed — the 12 existing games (import via phpMyAdmin) |
| `.env.example` | Template for the `.env` you create on the server |
| `.htaccess` | Pretty URLs, 404s, and blocking of server-side files |

---

## Run locally (optional)

```bash
cp .env.example .env            # then edit: set ADMIN_PASSWORD, keep SITE_URL=http://localhost:8080
php scripts/seed.php path/to/games.json   # load the 12 games into local SQLite
php -S localhost:8080 scripts/dev-router.php
```

Open http://localhost:8080 — the database is a local SQLite file
(`data/app.sqlite`, auto-created); no MySQL needed for development.
Admin console: `http://localhost:8080/admin/` (username/password from `.env`).

---

## Deploy on Hostinger (shared hosting)

1. **Upload the project** into `public_html`:
   *GitHub → hPanel → Websites → Git: point it at this repository*,
   or upload everything with the File Manager. Do **not** upload `node_modules/`.
2. **Create the MySQL database** (hPanel → Databases → MySQL), then in **phpMyAdmin**
   select it → **Import** → choose `database.sql` → Go. (12 games appear immediately.)
3. **Create `.env`** in `public_html` (File Manager → New File):
   copy `.env.example` and fill in your real domain as `SITE_URL`, the MySQL
   credentials (`DB_DSN`, `DB_USER`, `DB_PASS`), and a strong `ADMIN_PASSWORD`.
   *(The tables are also auto-created on first request, but the import loads the games.)*
4. **Done.** Visit `/` and sign in at `/admin/`.

> `.env` is listed in `.gitignore` — it must never be committed. It holds the
> admin password and database credentials.

### After changing PHP/CSS templates

Tailwind utilities are pre-compiled into `assets/css/tailwind.css`. Only if you
edit the PHP templates and want new utility classes:

```bash
npm install
npm run build:css
```

The design system itself lives in `assets/css/global.css` + `assets/css/portal.css`
and needs no build step.

---

## Notes

* **Analytics** are first-party: a same-origin beacon posts page loads and game-frame
  opens to `/api/track/`; counts are stored in the `analytics` table. No cookies,
  no third-party trackers, no estimates.
* **Uploads** accept JPG/PNG/WebP/GIF/AVIF (max 8 MB); images are auto-downscaled to
  1600 px with GD so covers never wreck page speed. SVG is rejected on purpose.
* **SEO**: every route has its own title/description/canonical/OG from `includes/seo.php`;
  `sitemap.xml` and `robots.txt` are generated per request from the live library.
