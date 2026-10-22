/**
 * Generates database.sql — the phpMyAdmin seed for Hostinger MySQL — from the
 * original data/games.json (the operator's existing library, never modified).
 *
 * Timestamps are normalised from ISO-8601 ("…T…Z") to MySQL DATETIME
 * ("YYYY-MM-DD HH:MM:SS") because strict-mode DATETIME rejects the trailing Z.
 *
 * Run: node scripts/gen-seed.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = 'D:/gaming_website/data/games.json';

const data = JSON.parse(readFileSync(SOURCE, 'utf8'));
const games = data.games ?? [];

const sqlStr = (s) => {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
};
const sqlTime = (iso) => {
  // "2026-10-21T18:00:00.000Z" → "2026-10-21 18:00:00" (UTC, unchanged values)
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/.exec(String(iso ?? ''));
  return m ? `${m[1]} ${m[2]}` : gmdateNow();
};
const gmdateNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

const header = `-- ----------------------------------------------------------------------------
-- Parking Fury Guide — database seed (MySQL / MariaDB, e.g. Hostinger)
--
-- How to use (Hostinger hPanel):
--   1. Databases → MySQL → create a database + user, note the credentials.
--   2. phpMyAdmin → select that database → Import → choose this file → Go.
--   3. Copy those credentials into .env (DB_DSN/DB_USER/DB_PASS).
--
-- Note: the PHP app also self-creates empty tables on first request, so the
-- import step is only needed to load these 12 games in one go.
-- Generated from data/games.json — ${games.length} games, covers must already be
-- present in /uploads/ (they ship with the project).
-- ----------------------------------------------------------------------------

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS \`games\` (
  \`id\`          VARCHAR(64)  NOT NULL,
  \`slug\`        VARCHAR(80)  NOT NULL,
  \`title\`       VARCHAR(200) NOT NULL,
  \`description\` TEXT         NOT NULL,
  \`category\`    VARCHAR(60)  NOT NULL DEFAULT '',
  \`tags\`        TEXT         NULL,
  \`controls\`    TEXT         NULL,
  \`specs\`       TEXT         NULL,
  \`cover\`       VARCHAR(255) NULL,
  \`embed_url\`   VARCHAR(500) NOT NULL,
  \`status\`      VARCHAR(20)  NOT NULL DEFAULT 'draft',
  \`featured\`    TINYINT(1)   NOT NULL DEFAULT 0,
  \`created_at\`  DATETIME     NOT NULL,
  \`updated_at\`  DATETIME     NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY games_slug (\`slug\`),
  KEY games_status (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`analytics\` (
  \`day\`    DATE        NOT NULL,
  \`kind\`   VARCHAR(10) NOT NULL,
  \`ref\`    VARCHAR(220) NOT NULL,
  \`count\`  INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (\`day\`, \`kind\`, \`ref\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

`;

const rows = games.map((g) => {
  const tags = JSON.stringify(g.tags ?? []);
  const specs = JSON.stringify(g.specs ?? []);
  return (
    'INSERT INTO `games` (`id`,`slug`,`title`,`description`,`category`,`tags`,`controls`,`specs`,`cover`,`embed_url`,`status`,`featured`,`created_at`,`updated_at`) VALUES (' +
    [
      sqlStr(g.id),
      sqlStr(g.slug),
      sqlStr(g.title),
      sqlStr(g.description),
      sqlStr(g.category ?? ''),
      sqlStr(tags),
      sqlStr(g.controls ?? ''),
      sqlStr(specs),
      sqlStr(g.cover ?? null),
      sqlStr(g.embedUrl),
      sqlStr(g.status === 'draft' ? 'draft' : 'published'),
      g.featured ? 1 : 0,
      sqlStr(sqlTime(g.createdAt)),
      sqlStr(sqlTime(g.updatedAt)),
    ].join(',') +
    ');'
  );
});

const footer = '\nSET FOREIGN_KEY_CHECKS = 1;\n';

writeFileSync(join(ROOT, 'database.sql'), header + rows.join('\n') + footer, 'utf8');
console.log(`database.sql written: ${games.length} games seeded.`);
