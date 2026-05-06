#!/usr/bin/env node
/* Build all itinerary HTML pages from data/<trip-name>.json.
 *
 * Usage: node build.mjs <trip-name>      (e.g. "yates" or "greece")
 *        node build.mjs                  (defaults to "yates")
 *
 * Emits into renderer/templates/: cover.html, note.html, know-before.html,
 * overview.html, lodging.html, day-NN.html (one per day), snapshot.html,
 * hotel-directory.html, contacts.html, confirmations-divider.html.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const tripName = process.argv[2] || 'yates';
const dataPath = resolve(root, `data/${tripName}.json`);
const trip = JSON.parse(readFileSync(dataPath, 'utf8'));

const tmplDir = resolve(root, 'renderer/templates');
const photoDir = resolve(root, 'renderer/assets/photos');
mkdirSync(tmplDir, { recursive: true });

// True only if the file is actually on disk; lets us toggle photo backgrounds
// vs. placard fallbacks without templates breaking when assets are missing.
const photoExists = (rel) => !!rel && existsSync(resolve(photoDir, rel));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// title_html is allowed to include <br>; pass through after escaping & only.
const escTitle = (s) => String(s ?? '').replace(/&(?!(?:amp|lt|gt|quot|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

const FOOTER = trip.footer;
const footerLine = `<div class="footer-line">${esc(FOOTER)}</div>`;

function write(name, html) {
  const path = resolve(tmplDir, name);
  writeFileSync(path, html, 'utf8');
  console.log(`✓ wrote ${path}`);
}

// Clean existing day-*.html files so renaming/reducing days doesn't leave stragglers.
for (const f of readdirSync(tmplDir)) {
  if (/^day-\d+\.html$/.test(f)) unlinkSync(resolve(tmplDir, f));
}

// ──────────────────────────────────────────────────────────────────────────
// COVER
// ──────────────────────────────────────────────────────────────────────────

function coverHtml() {
  const c = trip.cover;
  const hasPhoto = photoExists(c.photo);
  const photoStyle = hasPhoto
    ? `background-image:url('../assets/photos/${esc(c.photo)}');background-size:cover;background-position:center;`
    : '';
  const placard = hasPhoto
    ? ''
    : `<div class="cover-photo-placard">${esc(c.hero_label || '')}</div>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · ${esc(trip.title || '')} — Cover</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  body { background: var(--paper-soft); }
  .cover-photo {
    position: absolute; top: 0; left: 0; right: 0; height: 6.4in;
    background-color: #DCD2BD;
    ${photoStyle}
    display: flex; align-items: center; justify-content: center;
  }
  .cover-photo-placard {
    font-family: var(--font-label);
    font-size: 7pt; font-weight: 500; letter-spacing: 0.32em;
    text-transform: uppercase; color: rgba(31, 54, 65, 0.45);
  }
  .cover-block {
    position: absolute; top: 6.4in; left: 0; right: 0; bottom: 0;
    padding: 0.7in 1in 0.85in;
    text-align: center;
    background: var(--paper-soft);
  }
  .brand-mark {
    font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.42em; text-indent: 0.42em; text-transform: uppercase;
    color: var(--ink-mute);
  }
  .cover-title {
    margin-top: 0.32in;
    font-family: var(--font-display); font-weight: 400;
    font-size: 26pt; line-height: 1.18; color: var(--ink); letter-spacing: 0.005em;
  }
  .cover-destination {
    margin-top: 0.15in;
    font-family: var(--font-script); color: var(--accent);
    font-size: 56pt; line-height: 1; letter-spacing: -0.005em;
  }
  .cover-dates {
    margin-top: 0.42in;
    font-family: var(--font-label); font-weight: 500; font-size: 8pt;
    letter-spacing: 0.34em; text-indent: 0.34em; text-transform: uppercase;
    color: var(--ink-soft);
  }
</style>
</head>
<body>
<section class="page">
  <div class="cover-photo">${placard}</div>
  <div class="cover-block">
    <div class="brand-mark">${esc(c.brand_mark || 'JET · Joanna Elizabeth Travel')}</div>
    <h1 class="cover-title">${escTitle(c.title_html || '')}</h1>
    <div class="cover-destination">${esc(c.destination_script || '')}</div>
    <div class="cover-dates">${esc(c.dates || '')}</div>
  </div>
</section>
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// NOTE
// ──────────────────────────────────────────────────────────────────────────

function noteHtml() {
  const n = trip.note;
  const paragraphs = (n.body || []).map((p) => `    <p>${esc(p)}</p>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · A Note from ${esc(n.signature || 'your advisor')}</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  .note { padding: 1.0in 1.1in 1.1in; }
  .note-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .note-greeting { margin-top: 0.18in; font-family: var(--font-display); font-weight: 400;
    font-size: 38pt; line-height: 1.1; color: var(--ink); letter-spacing: 0.005em; }
  .note-body { margin-top: 0.45in; max-width: 5.6in;
    font-family: var(--font-body); font-size: 12pt; line-height: 1.7; color: var(--ink); }
  .note-body p { margin-bottom: 11pt; }
  .note-signoff { margin-top: 0.45in; font-family: var(--font-body); font-size: 12pt; color: var(--ink); }
  .note-signature { margin-top: 4pt; font-family: var(--font-script); font-size: 36pt;
    line-height: 1; color: var(--accent); }
</style>
</head>
<body>
<section class="page note">
  <div class="note-eyebrow">${esc(n.eyebrow || 'A Note from Your Advisor')}</div>
  <h1 class="note-greeting">${esc(n.salutation || '')}</h1>

  <div class="note-body">
${paragraphs}
  </div>

  <div class="note-signoff">${esc(n.sign_off || 'Warmly,')}</div>
  <div class="note-signature">${esc(n.signature || '')}</div>

  ${footerLine}
</section>
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// KNOW BEFORE YOU GO
// ──────────────────────────────────────────────────────────────────────────

function kbygHtml() {
  const k = trip.kbyg;
  if (!k) return null;
  const topics = (k.topics || []).map((t) => `
    <div class="topic">
      <div class="topic-label">${esc(t.label)}</div>
      <div class="topic-head">${esc(t.head)}</div>
      <div class="topic-body"><p>${esc(t.body)}</p></div>
    </div>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · Know Before You Go — ${esc(k.title)}</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  .kbyg { padding: 0.7in 0.95in 0.8in; }
  .kbyg-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .kbyg-title { margin-top: 0.10in; font-family: var(--font-display); font-weight: 400;
    font-size: 36pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .kbyg-sub { margin-top: 6pt; font-family: var(--font-body); font-style: italic;
    font-size: 11pt; color: var(--ink-soft); line-height: 1.4; max-width: 5.6in; }
  .kbyg-grid { margin-top: 0.28in; display: grid; grid-template-columns: 1fr 1fr;
    gap: 0.16in 0.30in; }
  .topic { padding-top: 9pt; border-top: 0.5px solid var(--hairline); }
  .topic-label { font-family: var(--font-label); font-weight: 500; font-size: 6.5pt;
    letter-spacing: 0.30em; text-transform: uppercase; color: var(--accent); }
  .topic-head { margin-top: 4pt; font-family: var(--font-display); font-weight: 400;
    font-size: 13pt; line-height: 1.2; color: var(--ink); }
  .topic-body { margin-top: 4pt; font-family: var(--font-body); font-size: 9.5pt;
    color: var(--ink); line-height: 1.45; }
  .topic-body p { margin-bottom: 3pt; }
  .topic-body p:last-child { margin-bottom: 0; }
</style>
</head>
<body>
<section class="page kbyg">
  <div class="kbyg-eyebrow">${esc(k.eyebrow || 'Know Before You Go')}</div>
  <h1 class="kbyg-title">${esc(k.title)}</h1>
  <p class="kbyg-sub">${esc(k.sub || '')}</p>

  <div class="kbyg-grid">${topics}
  </div>

  ${footerLine}
</section>
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// OVERVIEW
// ──────────────────────────────────────────────────────────────────────────

function overviewHtml() {
  const o = trip.overview || {};
  const days = trip.days || [];
  // Page 1 fits the title block + ~5 rows comfortably; spill the rest onto
  // page 2. Threshold is intentionally conservative so a long row title
  // doesn't push the last entry under the footer.
  const FIRST_PAGE_MAX = 5;
  const split = days.length > 6;
  const page1 = split ? days.slice(0, FIRST_PAGE_MAX) : days;
  const page2 = split ? days.slice(FIRST_PAGE_MAX) : [];

  const renderRows = (list) => list.map((d) => {
    const dateBits = (d.weekday || '').slice(0, 3) + '<br>' + (d.date_label || '').replace(/^[A-Za-z]+,\s*/, '');
    return `
    <div class="day-row">
      <div class="num">${esc(d.n)}</div>
      <div class="date">${dateBits}</div>
      <div>
        <div class="title">${esc(d.title)}</div>
        <div class="summary">${esc(d.overview_summary || d.subtitle || '')}</div>
      </div>
    </div>`;
  }).join('\n');

  const styles = `
  .overview { padding: 0.85in 1.0in 0.95in; }
  .ov-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .ov-title { margin-top: 0.14in; font-family: var(--font-display); font-weight: 400;
    font-size: 42pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .ov-summary { margin-top: 0.18in; font-family: var(--font-body); font-size: 11.5pt;
    color: var(--ink); line-height: 1.5; }
  .ov-summary .who { font-weight: 500; }
  .ov-summary .where { font-family: var(--font-script); color: var(--accent);
    font-size: 22pt; line-height: 1; display: block; margin-top: 4pt; }
  .timeline { margin-top: 0.32in; border-top: 0.5px solid var(--hairline); }
  .day-row { display: grid; grid-template-columns: 0.5in 1.0in 1fr;
    column-gap: 0.20in; align-items: baseline; padding: 14pt 0;
    border-bottom: 0.5px solid var(--hairline); }
  .day-row .num { font-family: var(--font-display); font-weight: 400; font-size: 26pt;
    line-height: 1; color: var(--accent); letter-spacing: -0.01em; }
  .day-row .date { font-family: var(--font-label); font-weight: 500; font-size: 8pt;
    letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-mute); line-height: 1.4; }
  .day-row .title { font-family: var(--font-display); font-weight: 400; font-size: 16pt;
    line-height: 1.18; color: var(--ink); }
  .day-row .summary { margin-top: 4pt; font-family: var(--font-body); font-style: italic;
    font-size: 10.5pt; color: var(--ink-soft); line-height: 1.45; }`;

  const page1Section = `<section class="page overview">
  <div class="ov-eyebrow">${esc(o.eyebrow || 'Your Trip')}</div>
  <h1 class="ov-title">${esc(o.title || 'At a Glance')}</h1>

  <p class="ov-summary">
    <span class="who">${esc(o.who || '')}</span> · ${esc(o.summary_line || '')}
    <span class="where">${esc(o.where_script || '')}</span>
  </p>

  <div class="timeline">${renderRows(page1)}
  </div>

  ${footerLine}
</section>`;

  const page2Section = page2.length === 0 ? '' : `
<section class="page overview">
  <div class="ov-eyebrow">${esc(o.eyebrow || 'Your Trip')} · Continued</div>
  <h1 class="ov-title">${esc(o.title || 'At a Glance')}</h1>

  <div class="timeline" style="margin-top: 0.20in;">${renderRows(page2)}
  </div>

  ${footerLine}
</section>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · ${esc(o.title || 'At a Glance')}</title>
<link rel="stylesheet" href="../styles/base.css">
<style>${styles}
</style>
</head>
<body>
${page1Section}${page2Section}
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// LODGING — single-stop (rich) or multi-stop (compact list with location headers)
// ──────────────────────────────────────────────────────────────────────────

function lodgingHtml() {
  const l = trip.lodging;
  if (!l) return null;
  const stops = l.stops || [];
  if (stops.length === 0) return null;

  if (stops.length === 1) return lodgingSingle(l, stops[0]);
  return lodgingMulti(l, stops);
}

function lodgingSingle(l, stop) {
  const hasPhoto = photoExists(stop.photo);
  const photoBg = hasPhoto
    ? `background-image: url('../assets/photos/${esc(stop.photo)}'); background-size: cover; background-position: center;`
    : '';
  const blocks = [];
  if (stop.suite?.length) blocks.push(['Your Suite', stop.suite]);
  if (stop.inclusions?.length) blocks.push(['Hotel Inclusions', stop.inclusions]);
  if (stop.virtuoso?.length) blocks.push([stop.virtuoso_label || 'Virtuoso Amenities', stop.virtuoso]);
  if (stop.contacts?.length) blocks.push(['Hotel Contacts', stop.contacts]);

  const blockHtml = blocks.map(([label, items]) => `
      <div>
        <div class="block-label">${esc(label)}</div>
        <ul class="block-list">
${items.map((i) => `          <li>${esc(i)}</li>`).join('\n')}
        </ul>
      </div>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · ${esc(l.eyebrow || 'Your Home for the Week')} — ${esc(stop.name)}</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  body { background: var(--paper-soft); }
  .lodging-photo {
    position: absolute; top: 0; left: 0; right: 0; height: 4.4in;
    background-color: #DCD2BD; overflow: hidden; ${photoBg}
  }
  .lodging-photo-caption {
    position: absolute; inset: 0;
    display: ${hasPhoto ? 'none' : 'flex'};
    align-items: center; justify-content: center;
    font-family: var(--font-label); font-size: 7pt; font-weight: 500;
    letter-spacing: 0.32em; text-transform: uppercase;
    color: rgba(31, 54, 65, 0.40);
  }
  .lodging-body {
    position: absolute; top: 4.4in; left: 0; right: 0; bottom: 0;
    padding: 0.55in 1.1in 1.0in; background: var(--paper-soft);
  }
  .lodging-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .lodging-name { margin-top: 0.10in; font-family: var(--font-display); font-weight: 400;
    font-size: 32pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .lodging-desc { margin-top: 0.18in; font-family: var(--font-body); font-size: 11pt;
    line-height: 1.55; color: var(--ink); max-width: 6.4in; }
  .lodging-grid { margin-top: 0.32in; display: grid; grid-template-columns: 1fr 1fr;
    gap: 0.18in 0.32in; }
  .block-label { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.32em; text-transform: uppercase; color: var(--accent); margin-bottom: 8pt; }
  .block-list { list-style: none; font-family: var(--font-body); font-size: 10pt;
    line-height: 1.5; color: var(--ink); }
  .block-list li { padding-left: 12pt; position: relative; margin-bottom: 3pt; }
  .block-list li::before { content: '✦'; position: absolute; left: 0;
    color: var(--accent); font-size: 7pt; top: 1pt; }
</style>
</head>
<body>
<section class="page">
  <div class="lodging-photo">
    <div class="lodging-photo-caption">Property Photograph · ${esc(stop.name)}</div>
  </div>
  <div class="lodging-body">
    <div class="lodging-eyebrow">${esc(l.eyebrow || 'Your Home for the Week')}</div>
    <h1 class="lodging-name">${esc(stop.name)}</h1>

    <p class="lodging-desc">${esc(stop.description || '')}</p>

    <div class="lodging-grid">${blockHtml}
    </div>

    ${footerLine}
  </div>
</section>
</body>
</html>
`;
}

function lodgingMulti(l, stops) {
  const cards = stops.map((s) => {
    const photoBg = photoExists(s.photo)
      ? `background-image: url('../assets/photos/${esc(s.photo)}'); background-size: cover; background-position: center;`
      : 'background-color: #DCD2BD;';
    const meta = [s.dates, s.nights].filter(Boolean).map(esc).join(' · ');
    return `
    <div class="stop">
      <div class="stop-photo" style="${photoBg}"></div>
      <div class="stop-body">
        <div class="stop-loc">${esc(s.location || '')}</div>
        <div class="stop-name">${esc(s.name)}</div>
        ${meta ? `<div class="stop-meta">${meta}</div>` : ''}
        <div class="stop-desc">${esc(s.description || '')}</div>
      </div>
    </div>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · ${esc(l.eyebrow || 'Where You\'re Staying')}</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  body { background: var(--paper-soft); }
  .lodging-multi { padding: 0.65in 0.95in 0.8in; }
  .lm-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .lm-title { margin-top: 0.10in; font-family: var(--font-display); font-weight: 400;
    font-size: 36pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .lm-stops { margin-top: 0.24in; display: flex; flex-direction: column; gap: 0.16in; }
  .stop { display: grid; grid-template-columns: 2.0in 1fr; gap: 0.24in;
    border-top: 0.5px solid var(--hairline); padding-top: 0.14in; }
  .stop-photo { width: 2.0in; height: 1.35in; background-color: #DCD2BD; }
  .stop-loc { font-family: var(--font-label); font-weight: 500; font-size: 7pt;
    letter-spacing: 0.34em; text-transform: uppercase; color: var(--accent); }
  .stop-name { margin-top: 4pt; font-family: var(--font-display); font-weight: 400;
    font-size: 18pt; line-height: 1.1; color: var(--ink); }
  .stop-meta { margin-top: 3pt; font-family: var(--font-label); font-weight: 500;
    font-size: 7pt; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-mute); }
  .stop-desc { margin-top: 6pt; font-family: var(--font-body); font-size: 10pt;
    line-height: 1.45; color: var(--ink); }
</style>
</head>
<body>
<section class="page lodging-multi">
  <div class="lm-eyebrow">${esc(l.eyebrow || 'Where You\'re Staying')}</div>
  <h1 class="lm-title">${esc(l.title || 'Your Home Each Night')}</h1>
  <div class="lm-stops">${cards}
  </div>
  ${footerLine}
</section>
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// DAYS
// ──────────────────────────────────────────────────────────────────────────

function dayHtml(day) {
  const renderItem = (it) => {
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
  };

  // Approximate height per item: base 0.55in + ~0.18in for every ~80 chars of body
  // text (rough char-wrap). Items with meta lines add another 0.20in.
  const itemHeight = (it) => {
    const bodyLen = (it.body || '').length;
    const wraps = Math.max(1, Math.ceil(bodyLen / 80));
    return 0.45 + (wraps - 1) * 0.18 + (it.meta ? 0.22 : 0) + ((it.badges || []).length > 0 ? 0.05 : 0);
  };

  // Page 1 budget allows for the day header (~1.5in). Continuation pages use a
  // smaller header so they fit more items.
  const PAGE1_BUDGET = 8.0;
  const PAGEN_BUDGET = 9.4;

  const items = day.items || [];
  const pages = [[]];
  let used = 0;
  let budget = PAGE1_BUDGET;
  for (const it of items) {
    const h = itemHeight(it);
    if (used + h > budget && pages[pages.length - 1].length > 0) {
      pages.push([]);
      used = 0;
      budget = PAGEN_BUDGET;
    }
    pages[pages.length - 1].push(it);
    used += h;
  }

  const sections = pages.map((pageItems, pi) => {
    const isFirst = pi === 0;
    const headerBlock = isFirst
      ? `<header class="day-head">
    <div class="day-folio">${esc(day.n)}</div>
    <div class="day-meta">
      <div class="day-date">${esc(day.date_label)}</div>
      <h1 class="day-title">${esc(day.title)}</h1>
      <div class="day-subtitle">${esc(day.subtitle || '')}</div>
    </div>
  </header>`
      : `<header class="day-head" style="margin-bottom: 0.2in;">
    <div class="day-folio" style="font-size: 32pt;">${esc(day.n)}</div>
    <div class="day-meta">
      <div class="day-date">${esc(day.date_label)} · Continued</div>
      <h1 class="day-title" style="font-size: 18pt;">${esc(day.title)}</h1>
    </div>
  </header>`;
    return `<section class="page day">
  ${headerBlock}

  <ol class="day-items">
${pageItems.map(renderItem).join('\n')}
  </ol>

  ${footerLine}
</section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · ${esc(FOOTER)} — Day ${esc(day.n)}</title>
<link rel="stylesheet" href="../styles/base.css">
<link rel="stylesheet" href="../styles/day.css">
</head>
<body>
${sections}
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// SNAPSHOT (grouped reservations)
// ──────────────────────────────────────────────────────────────────────────

function snapshotHtml() {
  const s = trip.snapshot;
  if (!s) return null;
  const allGroups = s.groups || [];

  // Cap by row count so an over-stuffed group can't overflow the page. Page 1
  // is tighter because of the title block; continuation pages use a smaller
  // header so they fit more rows. Groups are kept whole — never split.
  const PAGE1_ROW_LIMIT = 14;
  const PAGEN_ROW_LIMIT = 18;

  const pages = [[]];
  let usedRows = 0;
  for (const g of allGroups) {
    const isFirst = pages.length === 1;
    const limit = isFirst ? PAGE1_ROW_LIMIT : PAGEN_ROW_LIMIT;
    const rowCount = (g.rows || []).length;
    if (usedRows + rowCount > limit && pages[pages.length - 1].length > 0) {
      pages.push([]);
      usedRows = 0;
    }
    pages[pages.length - 1].push(g);
    usedRows += rowCount;
  }

  const renderGroup = (g) => {
    const rows = (g.rows || []).map((r) => `      <tr><td class="col-day">${esc(r.day)}</td><td class="col-time">${esc(r.time || '')}</td><td class="col-name">${esc(r.name)}</td><td class="col-notes">${esc(r.notes || '')}</td></tr>`).join('\n');
    return `
  <div class="group">
    <div class="group-label">${esc(g.label)}</div>
    <table class="res">
${rows}
    </table>
  </div>`;
  };

  const sections = pages.map((groups, i) => {
    const isFirst = i === 0;
    const eyebrowText = isFirst
      ? (s.eyebrow || 'Confirmed Bookings')
      : `${s.eyebrow || 'Confirmed Bookings'} · Continued`;
    const titleBlock = `
  <div class="snapshot-eyebrow">${esc(eyebrowText)}</div>
  <h1 class="snapshot-title">${esc(s.title || 'Reservations Snapshot')}</h1>`;
    return `<section class="page snapshot">${titleBlock}
${groups.map(renderGroup).join('\n')}

  ${footerLine}
</section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · Confirmed Bookings — Reservations Snapshot</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  .snapshot { padding: 0.6in 0.95in 0.75in; }
  .snapshot-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .snapshot-title { margin-top: 0.10in; font-family: var(--font-display); font-weight: 400;
    font-size: 30pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .group { margin-top: 0.18in; }
  .group-label { font-family: var(--font-label); font-weight: 500; font-size: 7pt;
    letter-spacing: 0.34em; text-transform: uppercase; color: var(--accent);
    padding-bottom: 6pt; border-bottom: 0.5px solid var(--accent); margin-bottom: 0; }
  table.res { width: 100%; border-collapse: collapse;
    font-family: var(--font-body); font-size: 10pt; color: var(--ink); }
  table.res td { padding: 4pt 8pt; vertical-align: top;
    border-bottom: 0.5px solid var(--hairline); line-height: 1.3; }
  table.res tr:last-child td { border-bottom: none; }
  .col-day { width: 1.30in; font-family: var(--font-label); font-weight: 500;
    font-size: 7.5pt; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--accent); white-space: nowrap; }
  .col-time { width: 1.30in; color: var(--ink-soft); font-size: 9.5pt; white-space: nowrap; }
  .col-name { font-weight: 500; }
  .col-notes { color: var(--ink-soft); font-size: 9pt; line-height: 1.4; }
</style>
</head>
<body>
${sections}
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// CONTACTS
// ──────────────────────────────────────────────────────────────────────────

function contactsHtml() {
  const c = trip.contacts;
  if (!c) return null;
  const card = (entry, span) => {
    const rows = (entry.rows || []).map(([k, v]) => `        <li><span class="k">${esc(k)}</span><span>${esc(v)}</span></li>`).join('\n');
    return `    <div class="contact-card"${span ? ' style="grid-column: 1 / 3;"' : ''}>
      <div class="contact-name">${esc(entry.name)}</div>
      <div class="contact-role">${esc(entry.role || '')}</div>
      <ul class="contact-rows">
${rows}
      </ul>
    </div>`;
  };

  // Collect all entries (advisor + cards) so we can paginate consistently.
  const entries = [];
  if (c.advisor) entries.push(c.advisor);
  for (const card_ of (c.cards || [])) entries.push(card_);

  // Page 1 has the title block + intro — fits 4 cards (2 rows of 2).
  // Continuation pages have a smaller header and fit 6 cards (3 rows of 2).
  const PAGE1_CAP = 4;
  const PAGEN_CAP = 6;

  const pageGroups = [];
  let i = 0;
  while (i < entries.length) {
    const isFirst = pageGroups.length === 0;
    const cap = isFirst ? PAGE1_CAP : PAGEN_CAP;
    pageGroups.push(entries.slice(i, i + cap));
    i += cap;
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · Anything You Need — Important Contacts</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  .contacts { padding: 1.0in 1.1in 1.0in; }
  .contacts-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .contacts-title { margin-top: 0.18in; font-family: var(--font-display); font-weight: 400;
    font-size: 42pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .contacts-intro { margin-top: 0.18in; font-family: var(--font-body); font-size: 11pt;
    color: var(--ink); max-width: 5in; }
  .contacts-grid { margin-top: 0.45in; display: grid; grid-template-columns: 1fr 1fr;
    gap: 0.20in 0.30in; }
  .contact-card { background: var(--card); padding: 0.28in 0.32in 0.30in; }
  .contact-name { font-family: var(--font-display); font-weight: 400; font-size: 16pt;
    color: var(--ink); line-height: 1.2; }
  .contact-role { margin-top: 6pt; font-family: var(--font-label); font-weight: 500;
    font-size: 7pt; letter-spacing: 0.30em; text-transform: uppercase; color: var(--accent); }
  .contact-rows { margin-top: 12pt; list-style: none; }
  .contact-rows li { display: grid; grid-template-columns: 1.0in 1fr; gap: 6pt;
    padding: 5pt 0; font-family: var(--font-body); font-size: 10pt; line-height: 1.4; color: var(--ink); }
  .contact-rows .k { font-family: var(--font-label); font-weight: 500; font-size: 7pt;
    letter-spacing: 0.20em; text-transform: uppercase; color: var(--ink-mute); padding-top: 1.5pt; }
  .send-off { margin-top: 0.40in; text-align: center; font-family: var(--font-body);
    font-style: italic; font-size: 11.5pt; color: var(--ink); }
  .send-off-sig { margin-top: 6pt; font-family: var(--font-script); font-size: 32pt;
    color: var(--accent); line-height: 1; text-align: center; }
</style>
</head>
<body>
${pageGroups.map((group, pi) => {
  const isFirst = pi === 0;
  const isLast = pi === pageGroups.length - 1;
  const grouped = group.map((e, idx) => {
    // span the last card if odd count on this page
    const odd = group.length % 2 === 1;
    return card(e, odd && idx === group.length - 1);
  }).join('\n');
  const eyebrow = isFirst
    ? esc(c.eyebrow || 'Anything You Need')
    : esc((c.eyebrow || 'Anything You Need') + ' · Continued');
  const titleBlock = isFirst
    ? `<div class="contacts-eyebrow">${eyebrow}</div>
  <h1 class="contacts-title">${esc(c.title || 'Important Contacts')}</h1>
  <p class="contacts-intro">${esc(c.intro || '')}</p>

  <div class="contacts-grid">`
    : `<div class="contacts-eyebrow">${eyebrow}</div>
  <h1 class="contacts-title" style="font-size: 28pt;">${esc(c.title || 'Important Contacts')}</h1>

  <div class="contacts-grid" style="margin-top: 0.30in;">`;
  const sendOff = isLast && c.send_off
    ? `\n  <div class="send-off">"${esc(c.send_off)}"</div>\n  ${c.send_off_signature ? `<div class="send-off-sig">${esc(c.send_off_signature)}</div>` : ''}`
    : '';
  return `<section class="page contacts">
  ${titleBlock}
${grouped}
  </div>
${sendOff}

  ${footerLine}
</section>`;
}).join('\n')}
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// CONFIRMATIONS DIVIDER (static, just uses footer)
// ──────────────────────────────────────────────────────────────────────────

function confirmationsDividerHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · Your Confirmations</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  body { background: var(--paper-soft); }
  .divider {
    width: 8.5in; height: 11in;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    background: var(--paper-soft);
  }
  .divider-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 8pt;
    letter-spacing: 0.42em; text-indent: 0.42em; text-transform: uppercase; color: var(--accent); }
  .divider-title { margin-top: 0.20in; font-family: var(--font-display); font-weight: 400;
    font-size: 48pt; line-height: 1.05; color: var(--ink); }
  .divider-script { margin-top: 0.25in; font-family: var(--font-script);
    font-size: 36pt; color: var(--accent); line-height: 1; }
</style>
</head>
<body>
<section class="divider">
  <div class="divider-eyebrow">Appendix</div>
  <h1 class="divider-title">Your Confirmations</h1>
  <div class="divider-script">${esc(trip.cover?.destination_script || '')}</div>
</section>
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// HOTEL DIRECTORY (quick-reference cards for each lodging stop)
// ──────────────────────────────────────────────────────────────────────────

function hotelDirectoryHtml() {
  const stops = trip.lodging?.stops || [];
  // Only emit a directory if at least one stop has any contact field worth showing
  const hasAnyContact = stops.some((s) =>
    s.address || s.phone || s.concierge || s.email || s.web || s.directory_notes
  );
  if (!hasAnyContact) return null;

  const card = (s) => {
    const rows = [];
    if (s.location)         rows.push(['Location', s.location]);
    if (s.dates)            rows.push(['Dates', `${s.dates}${s.nights ? ' · ' + s.nights : ''}`]);
    if (s.address)          rows.push(['Address', s.address]);
    if (s.phone)            rows.push(['Phone', s.phone]);
    if (s.concierge)        rows.push(['Concierge', s.concierge]);
    if (s.email)            rows.push(['Email', s.email]);
    if (s.web)              rows.push(['Web', s.web]);
    if (s.directory_notes)  rows.push(['Notes', s.directory_notes]);

    const rowHtml = rows.map(([k, v]) => `        <li><span class="k">${esc(k)}</span><span>${esc(v)}</span></li>`).join('\n');
    return `    <div class="contact-card">
      <div class="contact-name">${esc(s.name)}</div>
      <div class="contact-role">Your ${esc((s.location || '').split('·')[0].trim() || 'Stay')}</div>
      <ul class="contact-rows">
${rowHtml}
      </ul>
    </div>`;
  };

  // Hotel cards carry up to ~8 rows each (location, dates, address, phone,
  // concierge, email, web, notes), so they're roughly twice as tall as the
  // contacts cards. Cap at 2 on page 1 and 4 on continuation pages.
  const PAGE1_CAP = 2;
  const PAGEN_CAP = 4;
  const pages = [];
  let i = 0;
  while (i < stops.length) {
    const cap = pages.length === 0 ? PAGE1_CAP : PAGEN_CAP;
    pages.push(stops.slice(i, i + cap));
    i += cap;
  }

  const intro = trip.lodging?.directory_intro
    || 'Quick-reference card for each property — addresses, phones, and concierge details for the road.';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>JET · Where You're Staying — Hotel Directory</title>
<link rel="stylesheet" href="../styles/base.css">
<style>
  .contacts { padding: 1.0in 1.1in 1.0in; }
  .contacts-eyebrow { font-family: var(--font-label); font-weight: 500; font-size: 7.5pt;
    letter-spacing: 0.36em; text-indent: 0.36em; text-transform: uppercase; color: var(--accent); }
  .contacts-title { margin-top: 0.18in; font-family: var(--font-display); font-weight: 400;
    font-size: 42pt; line-height: 1.05; letter-spacing: 0.005em; color: var(--ink); }
  .contacts-intro { margin-top: 0.18in; font-family: var(--font-body); font-size: 11pt;
    color: var(--ink); max-width: 5.6in; }
  .contacts-grid { margin-top: 0.45in; display: grid; grid-template-columns: 1fr 1fr;
    gap: 0.20in 0.30in; }
  .contact-card { background: var(--card); padding: 0.28in 0.32in 0.30in; }
  .contact-name { font-family: var(--font-display); font-weight: 400; font-size: 16pt;
    color: var(--ink); line-height: 1.2; }
  .contact-role { margin-top: 6pt; font-family: var(--font-label); font-weight: 500;
    font-size: 7pt; letter-spacing: 0.30em; text-transform: uppercase; color: var(--accent); }
  .contact-rows { margin-top: 12pt; list-style: none; }
  .contact-rows li { display: grid; grid-template-columns: 0.95in 1fr; gap: 6pt;
    padding: 5pt 0; font-family: var(--font-body); font-size: 9.5pt; line-height: 1.4; color: var(--ink); }
  .contact-rows .k { font-family: var(--font-label); font-weight: 500; font-size: 7pt;
    letter-spacing: 0.20em; text-transform: uppercase; color: var(--ink-mute); padding-top: 1.5pt; }
</style>
</head>
<body>
${pages.map((group, pi) => {
  const isFirst = pi === 0;
  const grouped = group.map(card).join('\n');
  const titleBlock = isFirst
    ? `<div class="contacts-eyebrow">Where You're Staying</div>
  <h1 class="contacts-title">Hotel Directory</h1>
  <p class="contacts-intro">${esc(intro)}</p>

  <div class="contacts-grid">`
    : `<div class="contacts-eyebrow">Where You're Staying · Continued</div>
  <h1 class="contacts-title" style="font-size: 28pt;">Hotel Directory</h1>

  <div class="contacts-grid" style="margin-top: 0.30in;">`;
  return `<section class="page contacts">
  ${titleBlock}
${grouped}
  </div>

  ${footerLine}
</section>`;
}).join('\n')}
</body>
</html>
`;
}

// ──────────────────────────────────────────────────────────────────────────
// EMIT
// ──────────────────────────────────────────────────────────────────────────

write('cover.html', coverHtml());
write('note.html', noteHtml());
const kbyg = kbygHtml(); if (kbyg) write('know-before.html', kbyg);
write('overview.html', overviewHtml());
const lodging = lodgingHtml(); if (lodging) write('lodging.html', lodging);
for (const day of (trip.days || [])) write(`day-${day.n}.html`, dayHtml(day));
const snap = snapshotHtml(); if (snap) write('snapshot.html', snap);
const directory = hotelDirectoryHtml(); if (directory) write('hotel-directory.html', directory);
const contacts = contactsHtml(); if (contacts) write('contacts.html', contacts);
write('confirmations-divider.html', confirmationsDividerHtml());

console.log(`\n✓ built trip "${tripName}" (${(trip.days || []).length} days, ${(trip.lodging?.stops || []).length} lodging stop(s))`);
