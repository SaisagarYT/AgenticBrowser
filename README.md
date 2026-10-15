# Agentic Browser (Node.js + Express + SQLite)

An autonomous web automation platform implementing a **3-agent collaborative feedback triad** (**Planner**, **Browser**, **Critique**), built with **Node.js**, **Express**, **Playwright**, and **SQLite** using strict JavaScript.

---

## Architecture Overview

```
User Prompt
    │
    ▼
┌─────────────────────────┐
│   Planner Agent         │ ◄─── Feedback from Critique
│   (Decomposes to Steps) │
└───────────┬─────────────┘
            │ Step N
            ▼
┌─────────────────────────┐
│   Browser Agent         │ ──── Playwright (Chromium)
│   (Executes Tool/Skill) │
└───────────┬─────────────┘
            │ Action Result + Screenshot
            ▼
┌─────────────────────────┐
│   Critique Agent        │
│   (Evaluates Progress)  │ ────► Terminate (Final Answer) OR Next Step
└─────────────────────────┘
```

### The 3 Specialized Agents

1. **Planner Agent** (`src/agents/plannerAgent.js`): Breaks down user goals into atomic, executable steps. Dynamically adapts the plan based on critique feedback and execution failures.
2. **Browser Agent** (`src/agents/browserAgent.js`): Drives Playwright to perform clicks, text input, form submissions, navigation, DOM queries, and screenshot captures.
3. **Critique Agent** (`src/agents/critiqueAgent.js`): Analyzes DOM mutations and visual changes via multimodal screenshots. Decides whether to proceed, replan, or terminate with the final answer.

---

## Project Structure

```
AgenticBrowser/
├── bin/
│   └── cli.js                     # Interactive CLI runner
├── public/                        # Built-in Web Dashboard
│   ├── index.html                 # Dark-mode live execution UI
│   ├── css/style.css              # Styling and animations
│   └── js/app.js                  # Frontend SSE stream & API client
├── src/
│   ├── index.js                   # Server entrypoint
│   ├── server.js                  # Express setup (CORS, static, routes)
│   ├── config.js                  # Validated environment configuration
│   ├── core/
│   │   ├── orchestrator.js        # The tri-agent loop coordinator
│   │   ├── browserManager.js      # Playwright browser lifecycle & screenshots
│   │   └── llmClient.js           # Multi-provider client (OpenAI, NVIDIA NIM, Groq, Ollama)
│   ├── agents/
│   │   ├── plannerAgent.js        # Planner Agent
│   │   ├── browserAgent.js        # Browser Agent
│   │   └── critiqueAgent.js       # Critique Agent
│   ├── db/
│   │   ├── database.js            # SQLite database initialization & migrations
│   │   └── repositories/          # CRUD repositories (tasks, plans, actions, critiques, logs)
│   ├── skills/                    # Modular Playwright actions
│   │   ├── index.js               # Skill registry
│   │   ├── openUrl.js             # URL navigation
│   │   ├── getUrl.js              # URL inspection
│   │   ├── clickSelector.js       # Element click
│   │   ├── enterText.js           # Text input
│   │   ├── enterTextAndClick.js   # Input + submit
│   │   ├── pressKey.js            # Keyboard shortcuts
│   │   ├── googleSearch.js        # Search API or browser fallback
│   │   ├── getDomContent.js       # DOM & MMID extraction
│   │   ├── pdfExtractor.js        # PDF text parser
│   │   ├── takeScreenshot.js      # Viewport capture
│   │   └── finalResponse.js       # Output formatter
│   ├── routes/
│   │   ├── apiRoutes.js           # REST API routes
│   │   └── sseRoutes.js           # Server-Sent Events live stream
│   └── utils/
│       ├── domHelper.js           # MMID tagging script
│       ├── ssAnalysis.js          # Screenshot visual diff analyzer
│       ├── errors.js              # Custom errors
│       └── logger.js              # Structured logger
├── data/                          # SQLite DB & screenshots (auto-created)
├── package.json
└── .env
```

---

## Getting Started

### 1. Install Dependencies & Playwright Browser

```bash
npm install
npx playwright install chromium
```

### 2. Configure Your `.env`

Copy `.env.example` to `.env` and set your API key:

```ini
AGENTIC_BROWSER_TEXT_MODEL=gpt-4o
AGENTIC_BROWSER_TEXT_API_KEY=your-api-key
AGENTIC_BROWSER_TEXT_BASE_URL=https://api.openai.com/v1

AGENTIC_BROWSER_SS_ENABLED=true
AGENTIC_BROWSER_SS_MODEL=gpt-4o
AGENTIC_BROWSER_SS_API_KEY=your-api-key
AGENTIC_BROWSER_SS_BASE_URL=https://api.openai.com/v1
```

*(You can point `AGENTIC_BROWSER_TEXT_BASE_URL` to NVIDIA NIM, Groq, Together AI, or local Ollama)*

---

## Running the Application

### Option A: Web Server & Live Dashboard (Recommended)

```bash
npm start
```
Open **`http://localhost:8000`** in your browser. You can type tasks, watch the 3 agents work in real-time, view screenshots, and inspect past tasks stored in SQLite!

### Option B: Interactive CLI

```bash
npm run cli
```
Or directly pass the prompt:
```bash
node bin/cli.js "Search for the price of RTX 4070 on Amazon and report the fastest delivery date"
```

---

## REST API Reference

### 1. Execute a Task (Compatible with TheAgenticBrowser)
```http
POST /api/execute_task
Content-Type: application/json

{
  "command": "Find the price of RTX 4070 on Amazon and tell me the delivery date."
}
```

### 2. Stream Live Task Progress (Server-Sent Events)
```http
GET /api/tasks/:id/stream
```

### 3. Retrieve Task Details & History
```http
GET /api/tasks
GET /api/tasks/:id
```
