FRIDAY Trading Terminal 🚀

Current Version: v12.2 (Scout Edition)

Engine: Vanilla JavaScript (ES6+), TailwindCSS, Lightweight Charts

Data Providers: Polygon.io (Market Data), Google Gemini (AI Analysis)

FRIDAY is a high-performance, responsive trading dashboard designed for the web. It features real-time charting, technical indicators, options chain analysis, and AI-powered market scouting.

📜 Complete Version History & Changelog

🧠 Phase 4: Artificial Intelligence (Current)

v12.2: Scout Edition

Feature: Introduced the "Binoculars" Icon UI.

Feature: Portfolio Scout: Analyzes your entire portfolio and watchlist to generate a daily rundown and weekly play suggestions.

UI: Unified all AI entry points (Chart, News, Portfolio) under the "Scout" theme.

v12.1: Deep Dive

Feature: Deep Dive Analysis: AI now analyzes chart trend + active indicators (RSI, SMA) + comparison correlations simultaneously.

Feature: Structured News: News AI now strictly categorizes output into "Positive Highlights" and "Negative Highlights".

Fix: Resolved Watchlist "Heart" icon state not updating immediately on click.

v12.0: AI Integration

Feature: Gemini API Support: Added configuration for Google Gemini API keys.

Feature: Chart Analysis: LLM reads recent OHLC data to identify support/resistance levels.

Feature: News Sentiment: LLM summarizes recent headlines to determine market sentiment.

⚡ Phase 3: Stability & Architecture

v11.3: The Consolidated Build

Fix: Merged modular files back into a single index.html to resolve "Module Loading" and CORS errors in serverless/preview environments.

Refactor: Namespaced code into App.Core, App.Network, App.State, App.Charts, and App.UI.

v11.2: Options Stability

Fix: Options Fallback: Added logic to default to the next available expiry if the current week has no data (crucial for weekends).

Fix: Price Safety: Prevents the options chain from crashing if the Quote API returns $0/null.

UX: Added specific error messages for API failures vs. Empty data.

v11.1: Scalability Engine

Architecture: Implemented a Smart Request Queue.

Logic: API calls are now throttled (350ms delay) and automatically retry with exponential backoff upon hitting HTTP 429 (Rate Limits).

v11.0: Broad Search

Refactor: Moved Options filtering from Server-side to Client-side. We now fetch raw contracts and sort locally to ensure "Near-the-Money" data is always found.

Feature: Comparison Overlays: Compare stock performance (e.g., AAPL vs SPY) on the same chart.

🛠 Phase 2: Core Trading Features

v10.0: Universal Search bar (Header) & Bid/Ask columns in Options.

v9.5: Rate Limit Optimization (Sparklines removed from Home to save credits).

v9.0: Sticky Headers for Options Table & Expiry sorting fixes.

v8.1: News Feed moved to main content area with pagination.

v8.0: Options Chain Debut: Integration of Polygon /v3/snapshot/options.

v7.5: Persistent Indicator State (Indicators survive page reloads).

v7.0: Expanded History (1000 candles) & Reverse-Sort data fetching.

🐣 Phase 1: Foundation

v6.0: Technical Indicators (SMA, EMA, VWAP, Supertrend).

v5.0: Timeframe Switching (1m, 5m, 1h, 1D) & Heiken Ashi calculation.

v4.0: Responsive "Split Logic" CSS (Mobile Stack vs. Desktop Grid).