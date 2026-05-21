# AI Smart Tracker

> **Module:** M2 – Conversation Intelligence | **Platform:** Revenue Intelligence Portal  
> **Storage:** PostgreSQL | **AI Engine:** Groq AI (with Rule-Based Fallback)

---

## Overview

The **AI Smart Tracker** is an AI-powered business signal detection engine within the M2 Conversation Intelligence module. It allows revenue teams to define **custom trackers** — intelligent monitors that detect specific business signals (such as pricing concerns, competitor mentions, or budget risks) inside customer conversation transcripts.

Unlike keyword search, Smart Tracker uses **Groq AI to understand business intent** — it detects whether a conversation contains a signal even when the exact keywords are not present.

---

## Business Purpose

Revenue teams need to know when customers are showing signs of risk, interest, or opportunity. Manually reading through call and email transcripts to find these signals is not scalable.

The AI Smart Tracker solves this by:

- **Letting teams define what matters** (e.g., "Is the customer raising a budget concern?")
- **Automatically scanning all conversations** for those signals using AI
- **Alerting teams when a signal is detected** so they can act on it
- **Tracking how often each signal appears** across all conversations

---

## Sidebar Integration

**AI Smart Tracker** is a top-level item in the Revenue Intelligence Portal sidebar — at the same level as AI Call Reviewer, Search, and Deals.

```
SIDEBAR
├── Home
├── Engage
├── Search
├── AI Call Reviewer
├── AI Smart Tracker    ← Main navigation item
├── Company library
├── Deals
└── ...
```

It is **not** nested inside Search or any sub-menu. It is an independent primary module.

---

## Smart Tracker vs. Search — Key Difference

| Feature | Search | AI Smart Tracker |
|---|---|---|
| **Method** | Keyword/text matching | AI business intent detection |
| **Query type** | "Find conversations containing word X" | "Find conversations where customer shows signal Y" |
| **Accuracy** | Exact match only | Detects intent even without exact keywords |
| **Purpose** | Information retrieval | Business signal monitoring |
| **Results** | Matching conversations | Detection records with confidence scores |

**Smart Tracker is NOT keyword search.** It is an AI-based intent detection system. A tracker like "Budget Risk" will find conversations where a customer expresses financial hesitation — even if they never say the word "budget."

---

## Main Features

| Feature | Description |
|---|---|
| Tracker Management | Create, edit, publish, and delete signal trackers |
| Draft vs Published | Trackers exist as drafts before being activated |
| Tracker Types | Pricing, Competitor, Objection, Risk, Custom |
| Scope Selection | Scan Calls only, Emails only, or Both |
| Speaker Side | Track signals from Agent, Customer, or Any speaker |
| Scan Conversations | On-demand scan of all conversations using published trackers |
| Detection Audits & Alerts | Full list of all detected signals with confidence scores |
| Search & Filtering | Search detections and filter by category or scope |
| Dashboard Stats | Total trackers, published count, total signals detected, high-quality matches |

---

## Tracker Management

### Creating a Tracker

1. Click **"+ Create Tracker"** from the dashboard header
2. Fill in the tracker form:
   - **Name** — a short label (e.g., "Competitor Mention")
   - **Business Question** — the intent to detect in natural language (e.g., "Is the customer comparing us to a competitor?")
   - **Description** — additional context for the AI
   - **Type** — Pricing / Competitor / Objection / Risk / Custom
   - **Scope** — Calls / Emails / Both
   - **Speaker Side** — Agent / Customer / Any
3. Save as **Draft** or **Publish** immediately

### Editing a Tracker

Click the edit icon on any tracker card to modify its configuration. Changes take effect on the next scan.

### Deleting a Tracker

Click the delete icon on a tracker card. Deleting a tracker also removes its associated detections.

---

## Draft vs Published Behavior

This is one of the most important concepts in the AI Smart Tracker.

| State | Behavior |
|---|---|
| **Draft** | Tracker is saved but **inactive** — it does NOT scan conversations and generates NO detections |
| **Published** | Tracker is **active** — it participates in every conversation scan and generates detections |

### Why Draft Trackers Don't Process Conversations

A draft tracker is considered a **work in progress**. It may have incomplete criteria or an unclear business question. Processing conversations with an unfinished tracker would generate unreliable detections that pollute the results.

Only **published trackers** represent finalized, approved signal definitions ready to be used in production scanning.

### Publishing a Tracker

Click the **Play icon** on any draft tracker card. The tracker status changes to **Published** immediately. It will now be included in all future scans.

### Pausing a Published Tracker

Click the **Pause icon** on any published tracker card. The tracker reverts to **Draft/Inactive** status and will be excluded from future scans.

---

## Tracker Types

| Type | Business Use Case |
|---|---|
| **Pricing** | Detect when customers raise questions about cost, pricing tiers, or discounts |
| **Competitor** | Detect when customers mention competitors or compare solutions |
| **Objection** | Detect when customers push back or raise concerns about the product |
| **Risk** | Detect signals of deal risk — delays, legal concerns, procurement holdups |
| **Custom** | Any user-defined business signal not covered by the above categories |

---

## Scope and Speaker Side

### Scope

| Scope | What gets scanned |
|---|---|
| **Calls** | Only call transcripts are scanned |
| **Emails** | Only email threads are scanned |
| **Both** | Both calls and emails are scanned |

### Speaker Side

| Speaker Side | What gets analyzed |
|---|---|
| **Agent** | Only the rep/agent's speech is analyzed |
| **Customer** | Only the customer's speech is analyzed |
| **Any** | The full conversation from both sides is analyzed |

This allows precise targeting — for example, a "Competitor Mention" tracker might only need to monitor what the **customer** says, while a "Closing Behavior" tracker might only analyze what the **agent** says.

---

## Scan Conversations Workflow

Clicking **"Scan conversations"** triggers an on-demand scan of all available conversation transcripts using all published trackers.

### What happens step by step

```
User clicks "Scan Conversations"
        ↓
System loads all Published (Active) trackers from PostgreSQL
        ↓
System loads all available seeded/live conversation transcripts
        ↓
For each Published Tracker:
        For each Conversation Transcript:
                ↓
                Groq AI receives:
                  - The full transcript (or relevant speaker side)
                  - The tracker's Business Question + context
                ↓
                Groq AI evaluates: "Does this conversation contain this signal?"
                ↓
                Groq AI returns: match result + confidence score + matched snippet
                ↓
                [If Groq AI fails → Rule-Based Fallback activates]
                ↓
                Fallback uses keyword patterns + heuristic rules
                        ↓
If signal is detected:
        Detection record created with:
          - Tracker name + type
          - Conversation ID (call or email)
          - Confidence score (0.0 to 1.0)
          - Matched text snippet
          - Detection timestamp
                ↓
Detection stored in PostgreSQL
                ↓
Dashboard statistics updated:
  - Total Signals Detected count updated
  - High Quality Matches (≥70% confidence) updated
  - Per-tracker detection count updated
                ↓
Detection Audits & Alerts tab refreshed
```

---

## Scan Progress Feedback (UI)

While scanning is in progress, the UI displays real-time status messages:

```
"Loading published trackers..."
        ↓
"Retrieving conversation transcripts..."
        ↓
"Analyzing signals via Groq AI..."
        ↓
"Syncing match metrics with database..."
        ↓
"Scan complete! Matches found: X"
  (or "No matches found for current trackers" if none detected)
```

---

## AI & Detection Architecture

### Groq AI Integration

**Groq AI** is the primary detection engine. It understands business intent from natural language.

- The tracker's **Business Question** is sent as a prompt instruction to Groq AI
- The **conversation transcript** (filtered by scope and speaker side) is the input text
- Groq AI determines if the signal is present and at what confidence level
- Returns a structured result with: `detected` (true/false), `confidence` (float), `snippet` (matched text)

### Rule-Based Fallback Detection

| Evaluator | When it runs |
|---|---|
| **Groq AI** | Always tried first |
| **Rule-Based Fallback** | Activates silently if Groq AI call fails |

The fallback uses keyword pattern matching based on the tracker type and business question. Results are less nuanced than Groq AI detections but ensure the scan always completes.

**The fallback is completely invisible to the end user.** Detection results appear the same in the UI regardless of which engine generated them.

---

## Why Detections Can Exceed Total Call Count

This is a common question when users see detection counts larger than the number of calls.

**One transcript can generate multiple detections** because:
- There are multiple **published trackers** — each one independently scans every conversation
- If 10 trackers are active and all 10 detect a signal in the same call, that is 10 detections from 1 call
- A single call can also match a tracker multiple times if the signal appears in multiple segments

**Example:**
```
Conversations available:  5
Published Trackers:       3 (Pricing Concern, Competitor Mention, Budget Risk)

If each tracker detects a signal in all 5 conversations:
Total Detections = 5 × 3 = 15 detections
```

This is expected and intentional behavior.

---

## Detection Audits & Alerts

The **Detection Audits & Alerts** tab shows all detections generated across all scans.

### What each detection card shows

| Field | Description |
|---|---|
| **Tracker Name** | Which tracker generated this detection |
| **Tracker Type** | Category badge (Pricing, Competitor, etc.) |
| **Source** | Whether matched from a Call or Email thread |
| **Confidence Score** | Percentage confidence the signal was present |
| **Quality Level** | High (≥70%) or Low (<70%) confidence label |
| **Matched Snippet** | The exact text segment where the signal was detected |
| **Timestamp** | When the detection was generated |

### Search & Filtering

- **Search bar** — filter detections by tracker name or matched snippet text
- **Category filter** — show detections from a specific tracker type only

---

## Seeded Conversation Scanning

In development and demo environments, the platform uses **seeded conversations** — pre-loaded demo transcripts stored in PostgreSQL that simulate realistic sales calls and email threads.

When "Scan conversations" is clicked, the system scans these seeded transcripts exactly as it would scan live production conversations. This allows full end-to-end demonstration of the detection flow without needing real customer data.

---

## Dashboard Statistics

| Stat Card | What it measures |
|---|---|
| **Total Trackers** | All trackers created (draft + published) |
| **Published Trackers** | Active trackers currently scanning (with draft count shown) |
| **Total Signals Detected** | All detections ever generated across all trackers |
| **High Quality Matches** | Detections with confidence score ≥ 70% |

---

## PostgreSQL Storage

All tracker data and detection results are stored directly in PostgreSQL (no Prisma ORM).

| Entity | What it stores |
|---|---|
| `smart_trackers` | Tracker definitions — name, question, type, scope, speaker side, published status |
| `tracker_detections` | Detection records — tracker ID, conversation ID, confidence score, snippet, timestamp |
| `conversations` | Seeded and live conversation transcripts used for scanning |

---

## Example Detections

### Detection: Pricing Concern

```
Tracker:     Pricing Concern
Type:        PRICING
Source:      Call review (Matched)
Confidence:  82% — High
Timestamp:   22 May 2026, 10:49 AM

Matched Snippet:
"The pricing feels quite steep compared to what we expected for this tier.
 Can you walk me through what's included at that level?"
```

### Detection: Competitor Mention

```
Tracker:     Competitor Mention
Type:        COMPETITOR
Source:      Email thread (Matched)
Confidence:  91% — High
Timestamp:   22 May 2026, 11:03 AM

Matched Snippet:
"We're also evaluating Salesforce and HubSpot for this use case.
 How does your platform differentiate?"
```

### Detection: Budget Risk

```
Tracker:     Budget Risk
Type:        RISK
Source:      Call review (Matched)
Confidence:  67% — Low
Timestamp:   22 May 2026, 09:30 AM

Matched Snippet:
"We may need to push this decision to Q3 — budget approvals are
 taking longer than expected this quarter."
```

---

## Real-World Business Use Cases

| Tracker | Business Action Triggered |
|---|---|
| **Pricing Concern** | Sales manager notified to discuss pricing strategy with rep |
| **Competitor Mention** | Competitive intelligence team alerted to prepare battlecard |
| **Budget Risk** | Deal marked for follow-up in 30 days — forecast adjusted |
| **Objection Handling** | Rep's manager reviews call for coaching opportunity |
| **Procurement Delay** | Deal timeline updated in CRM — risk score adjusted |

---

## Event-Driven Detection Flow Summary

```
Create Tracker
        ↓
Save as Draft or Publish
        ↓
Published trackers become ACTIVE
        ↓
User clicks "Scan Conversations"
        ↓
System loads all Published Trackers
        ↓
System loads all Conversation Transcripts
        ↓
For each Tracker × each Conversation:
        Groq AI checks tracker intent against transcript
                ↓
        [If Groq AI fails → Fallback detection activates]
                ↓
        Detection record created if signal found
                ↓
Detections stored in PostgreSQL
        ↓
Dashboard statistics updated
        ↓
Detection Audits & Alerts tab refreshed
        ↓
User sees all matched signals with confidence scores
```
