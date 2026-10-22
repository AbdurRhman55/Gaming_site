#!/usr/bin/env node
/**
 * Embed integration test — exercises the GameStage licensed-embed slot.
 * The slot only renders when GAME_EMBED_URL is set at build/dev time, so run
 * a server with the env var first, e.g.:
 *
 *   PowerShell:  $env:GAME_EMBED_URL='http://localhost:8123/og-template.html'; npm run dev
 *   then:        node scripts/embed-test.mjs            (success path)
 *
 *   PowerShell:  $env:GAME_EMBED_URL='http://10.255.255.1/'; npm run dev
 *   then:        node scripts/embed-test.mjs --timeout  (timeout/error path)
 */

import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p));

const BASE = (process.env.BASE_URL || 'http://localhost:4321').replace(/\/$/, '');
const mode = process.argv.includes('--timeout') ? 'timeout' : 'success';

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
});

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? ' — ' + detail : ''}`);
};

try {
  await page.goto(BASE + '/', { waitUntil: 'load' });

  const hasEmbedSlot = await page.locator('[data-embed]').count();
  const idleButton = await page.locator('[data-action="load-embed"]').count();
  if (hasEmbedSlot === 0) {
    console.log('SKIP: no embed slot on this build (GAME_EMBED_URL not set) — nothing to test.');
    console.log(`  (BASE=${BASE}, url=${page.url()}, title=${await page.title()}, load-embed buttons=${idleButton}, stage states in HTML: ${/data-embed/.test(await page.content()) ? 'data-embed present in DOM' : 'data-embed absent from DOM'})`);
    await browser.close();
    process.exit(0);
  }

  check('embed slot rendered when env configured', true);
  check('idle panel offers "Load the game"', idleButton === 1);

  await page.locator('[data-action="load-embed"]').click();

  if (mode === 'success') {
    const ok = await page
      .waitForFunction(() => document.querySelector('[data-stage-body]')?.dataset.state === 'embed-ready', undefined, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    check('embed reaches embed-ready state on successful frame load', ok,
      `state=${await page.evaluate(() => document.querySelector('[data-stage-body]')?.dataset.state)}`);
    const pill = await page.locator('[data-stage-pill]').textContent();
    check('pill reports the official frame loaded', /Official game loaded/.test(pill || ''), pill || '');
    const frameVisible = await page.locator('[data-embed]').isVisible();
    check('iframe visible in stage', frameVisible);
    await page.screenshot({ path: 'docs/screenshots/embed-1024.png' });
  } else {
    console.log('  (waiting up to 18s for the 15s load timeout…)');
    const ok = await page
      .waitForFunction(() => document.querySelector('[data-stage-body]')?.dataset.state === 'error', undefined, { timeout: 18000 })
      .then(() => true)
      .catch(() => false);
    check('unreachable embed falls back to error panel after timeout', ok,
      `state=${await page.evaluate(() => document.querySelector('[data-stage-body]')?.dataset.state)}`);
    const pill = await page.locator('[data-stage-pill]').textContent();
    check('pill reports embed timeout', /timed out/i.test(pill || ''), pill || '');
    const retry = await page.locator('[data-action="retry"]').isVisible();
    check('error panel offers retry', retry);
    const direct = await page.locator('[data-panel="error"] a[target="_blank"]').count();
    check('error panel keeps a direct link to the official game', direct >= 1);
    await page.screenshot({ path: 'docs/screenshots/embed-timeout-1024.png' });
  }

  check('no page errors during embed flow', errors.length === 0, errors.join(' | '));
} catch (err) {
  fail++;
  console.error('EXCEPTION:', err.message);
} finally {
  await browser.close();
}

console.log(`\n===== EMBED (${mode}): ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
