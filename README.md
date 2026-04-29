# FRIDAY 📈 

**A High-Performance Trading Terminal & Agentic Research Platform**

FRIDAY is a Progressive Web App (PWA) designed for advanced financial research and real-time market tracking. It combines a high-performance, mobile-first UX with deep agentic intelligence. By utilizing a bifurcated data architecture, FRIDAY delivers lightning-fast chart rendering alongside complex, multi-step LLM analysis.

## ✨ Core Features

* **High-Performance Charting:** Built on **Lightweight Charts** to render rapid tick data and historical candlesticks without UI stuttering.
* **Bifurcated Data Architecture:** * *UI Flow:* Fast-path data fetching directly via the Massive Python SDK for immediate visual feedback.
    * *Agent Flow:* Complex analytical queries routed through the **Massive MCP** server for SQL-based post-processing and data discovery.
* **AI Scout Reports:** An integrated AI research assistant that leverages Massive MCP (`search_endpoints`, `query_data`) to generate deep financial synthesis, sentiment analysis, and options chain evaluations.
* **Offline-Ready PWA:** Uses IndexedDB and Service Workers to cache historical data, allowing the terminal to function reliably even on intermittent connections.
* **Resilient Persistence:** Server-side **SQLite in WAL (Write-Ahead Logging) mode** ensures high read/write concurrency for portfolio states and real-time alerts.

## 🛠️ Technology Stack

**Frontend**
* React 18 & TypeScript
* Vite (Build & PWA generation)
* Zustand (High-frequency state management)
* Lightweight Charts (Data visualization)
* Tailwind CSS (Styling)

**Backend**
* Python 3.10+ & FastAPI
* Massive Python SDK (Market data)
* Massive MCP (Agentic tool calling via `mcp_massive`)
* SQLite + WAL (Database)
* Python-Socket.io (Real-time news streams)

## 📂 Architecture Overview

```text
/friday-terminal
├── /backend                     # FastAPI & Massive MCP
│   ├── main.py                  # Server entry & Socket.io
│   ├── core/
│   │   ├── mcp_client.py        # Communication with Massive MCP process
│   │   └── database.py          # SQLite WAL connection setup
│   ├── services/
│   │   ├── massive_data.py      # High-performance quotes/bars via Massive SDK
│   │   └── news_service.py      # Background tasks for live headlines
│   ├── Dockerfile
│   └── requirements.txt
├── /frontend                    # Vite + React + TypeScript
│   ├── src/
│   │   ├── components/          # Typed React components (Chart, ScoutReport)
│   │   ├── store/               # Zustand (Market & Portfolio state)
│   │   ├── hooks/               # useMassiveData, useChart
│   │   └── lib/                 # IndexedDB caching logic
│   ├── Dockerfile
│   ├── nginx.conf               # Production web server routing
│   └── vite.config.ts           # PWA & Build config
└── docker-compose.yml           # Unified local & production deployment
```

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Python (3.10+)
* [uv](https://github.com/astral-sh/uv) (for launching the Massive MCP server)
* Docker & Docker Compose (for production deployment)
* A Massive API Key

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
MASSIVE_API_KEY=your_massive_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
```

---

### 💻 Local Development

Use these steps if you are actively modifying the code and need hot-reloading for the frontend or backend.

**Start the Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*The local development app will be available at `http://localhost:5173`.*

---

### 🌐 Production Deployment (Docker)

For live environments, FRIDAY uses a containerized architecture with an optimized Nginx frontend and a production-grade FastAPI backend.

**Build and Start the Stack:**
From the root directory of the project, run:
```bash
docker compose up -d --build
```

This single command will:
1. Build the production-optimized Vite assets.
2. Serve the frontend through the configured `nginx.conf`.
3. Launch the FastAPI backend and Massive MCP server in isolated containers.

**Stop the Stack:**
```bash
docker compose down
```

## 🧠 Design Philosophy
FRIDAY is built around a balance of aesthetic innovation and functional accessibility, anchored by strong UX Compass principles. It prioritizes developer empathy, ensuring that the interface remains clean, responsive, and data-dense, whether accessed via a desktop browser or deployed locally as a standalone peripheral device.

## 📄 License
ISC License
```
