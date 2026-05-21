# R-Revenue Intelligence Platform 🚀

Welcome to the **R-Revenue Intelligence Platform**, an advanced, full-stack Monorepo designed to act as a futuristic enterprise revenue operations command center. This platform provides deep conversational intelligence, AI-driven insights, hybrid search, and actionable CRM analytics.

---

## 📖 What is this platform?

In simple terms, this platform is a "Search Engine for Revenue Teams." It records, transcribes, and analyzes sales calls, emails, and meetings. It then provides a **Searchable Conversation Library** where sales reps and managers can easily search, filter, and review historical conversations to gain insights, coach their teams, and close more deals.

Think of it as a blend of **Gong.io** (conversational analytics) and an advanced AI Search Engine!

---

## ✨ Core Features & What it Does

### 1. 🔍 Searchable Conversation Library
A central hub where all interactions (Sales Calls & Emails) are stored. You can search for specific words or phrases mentioned in calls across your entire organization.

### 2. 🧠 Hybrid AI Search (Text + Semantic)
We don't just match exact keywords. The platform uses a dual-engine hybrid search:
- **Full-Text Search:** Finds exact word matches (e.g., "Pricing").
- **Semantic Vector Search:** Uses AI to understand the *meaning* behind your search. If you search for "Costing," it will also pull up conversations discussing "Pricing," "Discounts," or "Financials."

### 3. 🎛️ Advanced Deal & Call Filters
Filter through thousands of calls in seconds using deep metadata:
- **CRM Context:** Filter by Deal Stage (Prospecting, Discovery, Closed Won, etc.).
- **Call Metadata:** Filter by Duration, Call Direction (Inbound/Outbound), and Media Type.
- **AI Classification:** Filter by AI-detected Call Topics and Sentiment (Positive, Neutral, Negative).
- **Interaction Metrics:** Filter by Talk Ratio (Rep vs. Customer) and the number of questions asked.

### 4. 📊 Dynamic Sorting
Instantly sort your filtered conversations by:
- **Date** (Most recent calls first)
- **Duration** (Longest calls first)
- **QA Score** (Highest scoring calls first)

### 5. 💾 Gong-Style CSV Export
Need the data in Excel? You can export the active, filtered list of conversations directly to a CSV file. The export allows you to pick specific columns (Call Metadata, CRM Fields, Tracker Data, Interaction Metrics) and generates the file instantly.

---

## 🛠️ Tech Stack & Architecture

This is a modern, enterprise-grade Modular Monolith (Monorepo) managed by **TurboRepo**.

### Frontend (Client-side)
- **Next.js 14** (App Router) & **React**
- **Vanilla CSS** with a custom "Light Mode Slate" design system (`globals.css`)
- **Lucide Icons** for beautiful, scalable UI graphics

### Backend (Server-side)
- **NestJS** framework for scalable backend architecture
- **Prisma ORM** for database interactions
- **PostgreSQL** with **pgvector** extension for AI vector embeddings and semantic search

---

## 🚀 How to Run the Application Locally

The project is built to run effortlessly using `pnpm`.

### 1. Navigate to the App Directory
Open your terminal and navigate to the project root:
```bash
cd "boilerplate code\r-revenue-intelligence"
```

### 2. Install Dependencies (If you haven't already)
```bash
pnpm install
```

### 3. Start the Development Server
Run this single command to start both the Frontend and Backend simultaneously:
```bash
pnpm dev
```
*(You can also use `pnpm run dev`)*

### 4. Access the Platform
Once the server is running, open your web browser and go to:
👉 **[http://localhost:3000](http://localhost:3000)**

You will land directly on the fully-styled Revenue Portal command center!

---

## 📂 Project Structure

```text
r-revenue-intelligence/
├── apps/
│   └── web/                   # Next.js Frontend Application
│       ├── src/app/           # Routing & Global Styles (globals.css)
│       └── src/modules/       # Feature Modules (e.g., m02-conversation-intelligence)
├── modules/                   # NestJS Backend Modules
│   └── m02-conversation-intelligence/  # Core logic for Hybrid Search & Database
├── database/                  # Prisma Schemas and Seed Data
├── package.json               # Root dependencies
└── turbo.json                 # Turborepo build pipeline config
```

---
*Built by the Technical Architecture & Relanto Engineering Team.*
