# Confirmations

Drop client-facing confirmation PDFs in this directory and they will be
automatically appended to the back of `samples/book.pdf` on the next render
(after the Important Contacts page, behind a "Your Confirmations" divider).

## How it works

The render script (`renderer/scripts/render.sh`) globs `confirmations/*.pdf`,
sorts them alphabetically, and appends them in that order via `pdfunite`.

## Naming convention

Prefix with a 2-digit number so they sort chronologically:

```
01-jetblue-outbound.pdf
02-tradewind-outbound.pdf
03-fouquets-hotel-confirmation.pdf
04-bonito-dinner.pdf
05-la-guerite-lunch.pdf
06-bagatelle-white-party.pdf
07-axopar-charter.pdf
08-sella-dinner.pdf
09-isola-dinner.pdf
10-tradewind-return.pdf
11-jetblue-return.pdf
```

The exact numbering is up to you — the script doesn't care, it just sorts
strings. Keep the prefixes consistent across a trip and the order stays sane.

## What to include

Anything the client should have a copy of for their records:

- Flight confirmations (airline-issued booking PDFs)
- Hotel reservation confirmations
- Dining reservation confirmations / emails
- Activity bookings (boat charter, transfers, etc.)
- Car / rental agreements

## What NOT to include

- Internal notes
- Pricing / commission docs
- Anything with another client's data
- Pre-departure questionnaires that aren't relevant to the traveler

## Excluding from a particular render

To skip the appendix entirely (e.g. when generating a draft), pass
`SKIP_CONFIRMATIONS=1`:

```
SKIP_CONFIRMATIONS=1 bash renderer/scripts/render.sh
```

## File size

Headless Chromium PDFs for the itinerary itself are small (~500 KB total).
Real PDF confirmations from airlines / hotels can be a few MB each. A trip
with 10 confirmations may end up around 30–50 MB. That's fine for email and
totally fine for download — just be aware before printing.
