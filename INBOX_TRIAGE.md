# Inbox Triage Protocol

This document defines how to run an accurate inbox triage in this Claude Code session.
The Gmail MCP tools are already connected — follow this protocol exactly to avoid the
problems of snippet-only retrieval, missed threads, and incomplete analysis.

---

## How to invoke

Say any of the following:
- "Triage my inbox from the past day"
- "Triage my inbox from the past week"
- "What needs my follow-up today?"

---

## The Protocol (Claude: follow this exactly)

### Step 1 — Pull all inbox threads for the period

Use `search_threads` with the correct time filter:
- Past day: `in:inbox newer_than:1d`
- Past week: `in:inbox newer_than:7d`

Set `pageSize: 50`. If the result includes a `nextPageToken`, paginate until all threads are retrieved.

**Do not stop at snippets.** The `search_threads` result only returns snippets and metadata.
You must fetch full content for every thread that is not obviously a bulk newsletter.

### Step 2 — Filter out noise before fetching full content

From the `search_threads` results, skip threads where:
- Sender domain is a known bulk/marketing sender (newsletters, promotions, loyalty programs, webinar invites)
- Subject lines match patterns like: "Save X%", "Newsletter", "Don't miss", "Upcoming webinar", "Summer edition", etc.
- The thread has only 1 message, the sender is a no-reply address, and the snippet is clearly promotional

Keep (always fetch full content for):
- Any thread with 2+ messages (active conversation)
- Any thread where Joanna is in the `toRecipients` AND the sender appears to be a real person (not marketing@, noreply@, newsletter@, etc.)
- Any thread where the subject or snippet contains: question marks, client names, booking IDs, hotel names, "action required", "confirmation", "inquiry", "availability", "reservation"
- Any thread in Joanna's SENT that has a reply from someone else (she initiated, waiting on response)

### Step 3 — Fetch full thread content

For each kept thread, call `get_thread` with `messageFormat: FULL_CONTENT`.

**Why this matters:** Snippets truncate at ~100 characters and often miss the key ask entirely.
Full content gives you the complete message body, all messages in the thread, and the actual question or action item.

If a `get_thread` result is too large (saved to a file), use a subagent to extract:
- Each message's date, sender, and first 800 characters of `plaintextBody`
- The most recent message in full
- Whether the last message is from Joanna (she's waiting on them) or from someone else (they're waiting on her)

### Step 4 — Score each thread against the four follow-up signals

For each thread, determine which signals apply:

| Signal | What to look for |
|--------|-----------------|
| **Direct question to Joanna** | Last message is from someone else, contains a question mark or explicit ask |
| **Joanna is the blocker** | Joanna was asked to provide something (documents, info, payment) and hasn't |
| **Time-sensitive / deadline** | Trip date within 14 days, "action required", deadline stated, booking could lapse |
| **Joanna initiated, no reply** | Last message is from Joanna (SENT), no response has come back |

### Step 5 — Output the triage

Present results in this format, highest priority first:

```
## Inbox Triage — [Date], Past [Day/Week]

### URGENT — [reason: trip imminent / deadline / blocking commission]
1. **[Action verb] — [Who / Subject]**
   - [1-2 sentences: what they asked or what's needed]
   - **Action: [specific thing to do, including any phone numbers, IDs, or deadlines]**

### ACTION REQUIRED — [business/commission at stake]
...

### CLIENT QUESTIONS — [need a reply]
...

### WAITING ON THEM — [you may want to follow up]
...

### FYI — [no reply needed, just awareness]
...
```

Only include threads that match at least one follow-up signal. Leave out anything that is
purely informational with no ask and no time pressure.

---

## Known context about Joanna's inbox

- **Email**: joanna.johnsen@fora.travel
- **Role**: Luxury travel advisor at Fora Travel
- **Fora system emails**: support@fora.travel, finance@foratravel.com, no-reply@email.fora.travel — these are operational, not promotional. Always read them fully.
- **High-signal senders**: Hotel reservations teams, DMCs, client names, property booking contacts
- **Low-signal senders**: marketing@*, newsletter@*, noreply@*, loyalty program mailers

---

## Pagination note

Gmail's `search_threads` returns at most 50 threads per call. For a 7-day triage, expect
2–4 pages. Always check for `nextPageToken` and fetch all pages before proceeding to Step 2.

---

## Why the old approach failed

- **Snippets only**: The default Claude behavior reads only the snippet field, which cuts off at ~100 chars. The actual question or ask is often in the middle or end of the email.
- **Missing threads**: Without pagination, only the first 20 threads are seen. A 7-day inbox can have 200+ threads.
- **No full thread history**: Without `get_thread`, you can't see the thread's prior context, so you can't tell whether Joanna already replied or whether she's the one waiting.
