#!/usr/bin/env node
/* Read data/yates.json and emit renderer/templates/day-NN.html for each day. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const data = JSON.parse(readFileSync(resolve(root, 'data/yates.json'), 'utf8'));

const tmplDir = resolve(root, 'renderer/templates');
mkdirSync(tmplDir, { recursive: true });

const esc = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function dayHtml(day, footer) {
  const items = day.items.map((it) => {
    const badges = (it.badges || []).map((b) => `<span class="di-badge">${esc(b)}</span>`).join('');
    const meta = it.meta ? `<div class="di-meta">${esc(it.meta)}</div>` : '';
    const loc = it.tz_loc ? `<div class="di-loc">${esc(it.tz_loc)}</div>` : '';
    return `      <li class="day-item">
        <div class="di-time-col">
          <div class="di-time">${esc(it.time)}</div>
          ${loc}
        </div>
        <div>
          <div class="di-title">${esc(it.title)}${badges ? `<span class="di-badges">${badges}</span>` : ''}</div>
          <div class="di-body">${esc(it.body)}</div>
          ${meta}
        </div>
      </li>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · ${esc(footer)} — Day ${esc(day.n)}</title>
<link rel="stylesheet" href="../styles/base.css">
<link rel="stylesheet" href="../styles/day.css">
</head>
<body>
<section class="page day">
  <header class="day-head">
    <div class="day-folio">${esc(day.n)}</div>
    <div class="day-meta">
      <div class="day-date">${esc(day.date_label)}</div>
      <h1 class="day-title">${esc(day.title)}</h1>
      <div class="day-subtitle">${esc(day.subtitle)}</div>
    </div>
  </header>

  <ol class="day-items">
${items}
  </ol>

  <div class="footer-line">${esc(footer)}</div>
</section>
</body>
</html>
`;
}

for (const day of data.days) {
  const out = dayHtml(day, data.footer);
  const path = resolve(tmplDir, `day-${day.n}.html`);
  writeFileSync(path, out, 'utf8');
  console.log(`✓ wrote ${path}`);
}
