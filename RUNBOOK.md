# How to use this — a runbook for non-coders

This repo turns a trip brief into a beautiful PDF itinerary in the JET house style. You don't have to understand the code to use it. You just have to know which file holds what.

---

## The mental model

There are two kinds of changes you'll make:

1. **Content per trip** — Joanna's flights, this client's hotel list, the welcome note. Lives in `data/<trip-name>.json`. New trips, new content edits, fresh client copy.
2. **Format & look** — fonts, colors, page layouts, when something breaks visually. Lives in `renderer/` (the templates and scripts).

For #1 you can use any Claude conversation. For #2, come back to this repo with Claude Code (or any code-aware Claude session).

---

## What's a "trip name"?

It's just **a short nickname for the trip** — anything memorable. So far we have:

- `yates` — Jennifer & Philip's St. Barths birthday trip
- `greece` — Joanna's Greek islands FAM

For a new trip, pick something short and obvious. `smith-italy-june` or `anderson-anniversary` or `paris-fall-26` all work. The trip name shows up in two places:

- The trip's recipe file: `data/<trip-name>.json`
- The folder where the finished PDFs land: `samples/<trip-name>/`

That's all. Pick whatever you'll remember.

---

## Starting a new trip — the 10-minute version

### Step 1 — Open a Claude conversation

Paste the brief (PDF, email, whatever you have) and tell Claude:

> Here's a new trip. Build me the recipe file `data/<trip-name>.json` matching the structure in `data/yates.json` or `data/greece.json`. Pull hotel addresses, phones, concierge emails, and websites from each property's site.

If Claude has web access, it will fetch real hotel info. If not, it will leave `—` placeholders for you to fill in once the local DMC sends you details.

### Step 2 — Drop in hero photos (optional but pretty)

Make a folder `renderer/assets/photos/<trip-name>/` and drop in:

- `cover.jpg` — the hero shot for the cover page (a destination wide-shot)
- `lodging-<hotelname>.jpg` — one per hotel for the Lodging page

If you skip this, the renderer falls back to a soft tan placeholder block — the document still works, it's just less photo-heavy.

### Step 3 — Run the render

In a terminal in this repo:

```
bash renderer/scripts/render.sh <trip-name>
```

The output lands in `samples/<trip-name>/`:
- `book.pdf` — the complete deliverable
- One PDF + PNG per page if you want to share previews

### Step 4 — Review

Open `samples/<trip-name>/book.pdf`. If anything looks off, see the troubleshooting section below.

---

## Day-to-day edits

### "Change the wording on Day 3" or "Add a new dinner reservation"

These are content edits. Open the trip's recipe file and edit the right block, or ask Claude to do it for you:

> In `data/greece.json`, on Day 03 (the Mykonos villa day), add a new item at 6:00 PM for cocktails at Pasaji.

Then re-run `bash renderer/scripts/render.sh greece`.

### "Add my client's flight info"

Same thing — open the recipe file, find the snapshot's "Flights" group and the relevant Day, add the legs. Or paste the airline confirmation into Claude and say "add these flights to data/<trip-name>.json".

### "Switch which hotel on Day 5"

Edit the lodging block (the `stops` array) and the day's items. Or ask Claude.

---

## When to come back here

Come back to this repo (with Claude Code or a code-aware Claude session) when:

- **The format itself needs to change** — different fonts, different page layouts, new sections, different cover style.
- **Something broke visually** — a page is overflowing, a footer is overlapping text, the layout cracks for an unusually long trip.
- **You want a new kind of page** — say a "Packing List" or "Weather Forecast" page that doesn't exist yet in the template.

Ask the code-aware Claude:

> The lodging page should now show a fifth column for Wi-Fi password. Update build.mjs and the schema, and re-render Greece to verify.

The format work happens in:
- `renderer/scripts/build.mjs` — the JavaScript that turns the recipe into HTML pages.
- `renderer/styles/base.css` and `renderer/styles/day.css` — the visual styling (fonts, colors, spacing).
- `renderer/templates/` — auto-generated; you don't edit these by hand.

---

## Common troubleshooting

### "Page has content cut off at the bottom"

The build script auto-paginates the Snapshot, Hotel Directory, Contacts, Overview, and individual Day pages when they're too long. If something still gets clipped, tell a code-aware Claude: "the snapshot is overflowing on this trip — tighten the per-page cap."

### "Hero photo isn't showing"

Check the filename in your `data/<trip-name>.json` matches the file in `renderer/assets/photos/<trip-name>/`. Filenames are case-sensitive.

### "Combined `book.pdf` didn't get created"

The script needs `pdfunite` (from `poppler-utils`) installed. On Mac: `brew install poppler`. On Linux: `apt-get install poppler-utils`. Without it you still get one PDF per page in `samples/<trip-name>/`.

### "Rendering needs Chrome and it's not finding it"

`renderer/scripts/render.sh` looks for Chrome at a specific path. If you're on a different machine, set the env var:

```
CHROME=/path/to/your/chrome bash renderer/scripts/render.sh <trip-name>
```

---

## What lives where — the cheat sheet

| What you want to change | File to edit |
| --- | --- |
| Add a new trip | New file: `data/<trip-name>.json` |
| Edit copy / hotels / days for an existing trip | `data/<trip-name>.json` |
| Swap a hero photo | Drop a JPG in `renderer/assets/photos/<trip-name>/` |
| Change fonts, colors, or spacing | `renderer/styles/base.css`, `renderer/styles/day.css` |
| Change a page's layout structure | `renderer/scripts/build.mjs` |
| Change which pages appear in the book and in what order | `renderer/scripts/render.sh` |

---

## The two-Claude workflow that actually works

**Trip-content Claude** (any conversation): "Here's the brief, here are the flights, write the recipe."

**Format Claude** (this repo, code-aware session): "Day pages are too dense — make the type one point smaller and tighten line height."

Keep them separate. Content edits don't need to know how the renderer works; format edits don't need to re-derive trip content from scratch.
