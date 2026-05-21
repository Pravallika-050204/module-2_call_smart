# AI Call Reviewer

> **Module:** M2 – Conversation Intelligence | **Platform:** Revenue Intelligence Portal  
> **Storage:** PostgreSQL | **AI Engine:** Groq AI (with Rule-Based Fallback)

---

## Overview

The **AI Call Reviewer** automatically evaluates recorded sales calls using AI-powered scoring. Instead of managers manually listening to every call, the system scores each one against defined quality criteria and generates objective performance metrics in real time.

Each call is scored based on active **scorecards** — configurable evaluation templates. Scoring is performed by **Groq AI** as the primary engine, with a **rule-based fallback** that activates automatically if the AI engine is unavailable.

---

## Business Purpose

Sales teams handle hundreds of calls weekly. Manual review is time-consuming, biased, and inconsistent. The AI Call Reviewer solves this by:

- **Automatically scoring every call** against standardized quality criteria
- **Identifying underperforming calls** that need human attention
- **Surfacing conversation patterns** like talk ratio and question rate
- **Flagging high-risk or low-quality calls** for manager review
- **Creating an objective, consistent scoring history** for coaching and QA

---

## Sidebar Integration

**AI Call Reviewer** is a top-level item in the Revenue Intelligence Portal sidebar — at the same level as Search, Deals, and Coaching.

```
SIDEBAR
├── Home
├── Engage
├── Search
├── AI Call Reviewer    ← Main navigation item
├── AI Smart Tracker
├── Company library
├── Deals
└── ...
```

---

## Main Features

| Feature | Description |
|---|---|
| Scorecard Management | Create, activate, and deactivate scoring templates |
| Multi-Scorecard Evaluation | One call scored against multiple active scorecards |
| QA Score Generation | AI generates a percentage quality score per call per scorecard |
| Confidence Score | AI confidence level attached to each generated score |
| Conversational Metrics | Talk ratio, question rate, longest monologue per call |
| Flagged Review | Calls below threshold are flagged for manual human review |
| Manual Override | Reviewers can submit their own score overriding the AI |
| Queue Simulator | Processes seeded/demo calls to demonstrate real scoring |

---

## Scorecard Management

### What is a Scorecard?

A **scorecard** is a configurable evaluation template defining how a call should be assessed. Each scorecard contains:
- A **name** (e.g., "Sales Discovery Call QA")
- **Evaluation criteria** (e.g., was the customer's pain understood? Did the rep set a next step?)
- An **active/inactive** status toggle

### Active vs Inactive Scorecards

| Status | Behavior |
|---|---|
| **Active** | Included in all new call evaluations automatically |
| **Inactive** | Saved but skipped during evaluation — no scores generated |

**Why multiple scorecards?** Different call types need different evaluation standards. A renewal call is judged differently from a cold outreach call. Multiple scorecards give a multi-dimensional view of performance.

---

## QA Score Generation

Each call receives a **QA Score (0–100%)** per active scorecard.

| Score Range | Meaning |
|---|---|
| 90–100% | Excellent |
| 70–89% | Good — minor gaps |
| 50–69% | Average — coaching recommended |
| Below 50% | Poor — call flagged for review |

---

## Conversational Metrics

| Metric | Description |
|---|---|
| **Talk Ratio** | % of conversation spoken by rep vs. customer. Healthy range: 40–60% each side |
| **Question Rate** | Number of questions asked by the rep per call — indicates discovery quality |
| **Longest Monologue** | Longest uninterrupted speaking segment — identifies one-sided conversations |

---

## Flagged Review System

A call is **flagged** when:
- QA score falls below the quality threshold (typically below 50%)
- AI confidence is low
- Unusual call patterns are detected (very short, no closing, all monologue)

**Why flagging exists:** Creates a prioritized review queue so managers focus only on calls that need attention — not reviewing everything manually.

### Flagged Review Workflow

```
AI scores call → Score below threshold detected
        ↓
Call marked as FLAGGED
        ↓
Appears in Flagged Calls dashboard section
        ↓
Manager opens call, reviews transcript + AI score
        ↓
Manager submits review (approve / override score)
        ↓
Call marked as REVIEWED → removed from flagged queue
        ↓
Dashboard counts updated
```

---

## Queue Simulator

A demonstration tool that processes **seeded (pre-loaded demo) calls** through the full AI scoring pipeline.

**Purpose:** In production, calls enter the pipeline automatically. In demo/dev environments, the Queue Simulator:
- Triggers AI scoring on seeded demo conversations
- Shows the full pipeline running in real time
- Populates the dashboard without needing live call data

---

## AI & Detection Architecture

### Groq AI Integration

**Groq AI** is the primary evaluation engine — a fast large language model that reads transcripts and evaluates them against scorecard criteria.

- Accessed via HTTP API from the backend service
- API key configured in environment: `GROQ_API_KEY`
- Receives: full transcript + scorecard criteria as a structured prompt
- Returns: structured JSON with criterion scores + overall confidence level

### Rule-Based Fallback Evaluator

| Evaluator | When it runs |
|---|---|
| **Groq AI** | Always tried first |
| **Rule-Based Fallback** | Activates silently if Groq AI call fails |

The fallback uses keyword matching, structural analysis, and heuristic scoring rules. **Completely transparent to the user** — the UI always shows the same clean result regardless of which engine generated it.

---

## Evaluation Workflow (End-to-End)

```
Call Transcript Generated / Seeded Call Loaded
                ↓
Transcript enters the scoring pipeline
                ↓
All Active Scorecards loaded from PostgreSQL
                ↓
For each Active Scorecard:
        Groq AI receives transcript + scorecard criteria
                ↓
        Groq AI evaluates → returns structured score
                ↓
        [If Groq AI fails → Rule-Based Fallback activates]
                ↓
QA Score + Confidence Score calculated
                ↓
Conversational Metrics calculated
(talk ratio, question rate, longest monologue)
                ↓
Results stored in PostgreSQL
                ↓
If QA Score < threshold → Call marked FLAGGED
                ↓
Dashboard refreshed → Scored call appears
```

---

## Dashboard Explanation

| Section | What it shows |
|---|---|
| **Summary Stats Row** | Total calls scored, average QA score, flagged count, active scorecards |
| **Scored Call List** | All evaluated calls with QA score, confidence, flag status, metrics |
| **Scorecard Panel** | All scorecards with active/inactive toggle and edit options |
| **Flagged Review Queue** | Calls awaiting manager review with AI rationale and override actions |

---

## Review Flow (Manual Override)

```
Manager opens flagged call
        ↓
Views transcript + AI-generated score + rationale
        ↓
Manager decides: Agree / Disagree with AI score
        ↓
If Disagree → Enter manual score + comment
        ↓
Submit review
        ↓
Call status → REVIEWED
        ↓
Manual score stored alongside AI score in PostgreSQL
        ↓
Call removed from flagged queue
```

---

## PostgreSQL Storage

All data stored directly in PostgreSQL (no Prisma ORM).

| Entity | What it stores |
|---|---|
| `scorecards` | Scorecard definitions, criteria, active status |
| `call_scores` | QA score per call per scorecard + confidence level |
| `call_metrics` | Talk ratio, question rate, monologue per call |
| `flagged_calls` | Flagged call records, review status, reviewer notes |
| `manual_reviews` | Manager override scores and comments |
| `conversations` | Seeded and live call transcripts |

---

## Detection Result Examples

### Scored Call

```
Call ID:       CALL-2024-1183
Date:          22 May 2026
Scorecard:     Sales Discovery Call QA

QA Score:      72%
Confidence:    High (89%)
Status:        Passed

Talk Ratio:    Rep 45% / Customer 55%
Question Rate: 8 questions per call
Longest Monologue: 2 min 14 sec (Customer)
```

### Flagged Call

```
Call ID:       CALL-2024-1190
Date:          22 May 2026
Scorecard:     Sales Discovery Call QA

QA Score:      38%
Confidence:    Medium (61%)
Status:        FLAGGED — Awaiting Review

Flag Reasons:
  - No next step set during call
  - Rep talk ratio: 78% (too dominant)
  - No qualifying questions detected
```

---

## Why These Features Exist

| Feature | Reason |
|---|---|
| **Scorecards** | Different call types need different quality standards — not one-size-fits-all |
| **Multiple Scorecards** | One call can be evaluated across multiple quality dimensions simultaneously |
| **Confidence Score** | Tells managers how reliable the AI evaluation is — low confidence = manual check needed |
| **Flagged Review** | Creates a smart prioritization layer so managers only intervene where needed |
