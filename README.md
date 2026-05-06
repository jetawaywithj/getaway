# JET Itinerary Builder

This folder turns a trip brief (a PDF, an email, whatever) into a finished, beautifully designed PDF itinerary in the JET house style.

You don't have to know how the code works. You just have to know **the magic prompt.**

---

## The magic prompt

Open Claude Code in this folder, then say something like:

> **Build me an itinerary for the Williams trip to Istanbul. Brief and confirmations attached.**

Drag in the brief PDF (and any flight or hotel confirmations). That's it. Claude will:

1. Read the brief.
2. Look up each hotel online for addresses, phones, websites, concierge emails.
3. Write the trip's recipe file to `data/williams-istanbul.json`.
4. Run the render and produce `samples/williams-istanbul/book.pdf`.
5. Hand you the finished PDF.

5–10 minutes of Claude time. About 30 seconds of yours.

---

## To make it look the way you want

After it's built, just keep talking:

> **The welcome note feels too formal — make it warmer, like the Yates one.**
>
> **Add Williams' flights — confirmation attached.**
>
> **Day 4 is too long, can you split the afternoon into a separate day?**
>
> **Move the Bosphorus cruise to before lunch.**

Claude will edit the recipe file and re-render. You see the updated PDF in seconds.

---

## What you'll need (one-time setup)

You only do this once:

1. **A laptop with Claude Code installed.** (`claude.ai/download`)
2. **This folder cloned to your laptop.** Ask anyone technical for help with this once, then you're done forever.
3. **`poppler` installed** so the renderer can stitch the pages into one PDF. On Mac, open Terminal and run `brew install poppler`. On Windows, ask Claude to walk you through it.
4. **Chromium installed** (the renderer uses headless Chrome to make PDFs). Most laptops already have this; if not, Claude can set it up.

After that, every new trip is just *"Build me an itinerary for…"*.

---

## The flow, in one picture

```
Brief PDF (from supplier)
        ↓
"Claude, build me an itinerary for [client]'s trip to [destination]"
        ↓
Claude reads, looks up hotels, writes the recipe
        ↓
Claude runs:  bash renderer/scripts/render.sh <trip-name>
        ↓
samples/<trip-name>/book.pdf  ← your finished deliverable
```

---

## Where things live

You don't usually need to know this — Claude handles it. But for reference:

| What | Where |
| --- | --- |
| The recipe for each trip (content, copy, hotels, days) | `data/<trip-name>.json` |
| Hero photos for each trip | `renderer/assets/photos/<trip-name>/` |
| Finished itinerary PDFs | `samples/<trip-name>/book.pdf` |
| The renderer code (only edit when changing the *format*) | `renderer/` |

---

## When something looks broken

Just tell Claude:

> **The Reservations Snapshot page is missing the bottom rows — fix it.**
>
> **Day 6 has the footer overlapping the last item.**
>
> **The cover photo isn't showing.**

Claude will look at the rendered output, figure out why, and patch it.

---

## When you want a real format change

Like a new fifth font, or adding a "Packing List" page, or changing the cover layout — same thing, just say it:

> **Add a Packing List page after Know Before You Go. It should have sections for clothes, electronics, documents.**

Claude will update the renderer code, rebuild, and show you the new page.

---

## A worked example

Here's how the Greece trip got built in this exact repo:

1. The user dropped in `Fam Trip in Greece.pdf` and said *"turn this into an itinerary."*
2. Claude wrote `data/greece.json` based on the brief.
3. Claude ran `bash renderer/scripts/render.sh greece`.
4. The user reviewed and said *"add my flights"* and pasted the airline confirmation.
5. Claude added the flights, re-rendered.
6. The user said *"the snapshot page is cut off"* — Claude paginated it.
7. The user said *"the contacts page should have a separate hotel directory"* — Claude split it into two sections.

Eight prompts. Fully designed 21-page PDF book. That's the whole loop.

---

## Trip names are just nicknames

Every trip needs a short nickname so the tool knows which trip is which. So far:

- `yates` — Jennifer & Philip's St. Barths birthday trip
- `greece` — Joanna's Greek islands FAM trip

For a new trip, pick anything memorable: `williams-istanbul`, `smith-italy-june`, `anderson-anniversary`. Claude will use this name for the recipe file and the output folder.

That's it. **Open Claude Code. Say the magic prompt. Get a finished itinerary.**

---

*Need more detail? See [`RUNBOOK.md`](./RUNBOOK.md) for the full reference, including troubleshooting and what to do when you want to tweak the format itself.*
