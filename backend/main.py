from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import asyncio
from typing import Optional
from pydantic import BaseModel
from services.ai_service import scout

from services.massive_data import fetch_candlesticks, fetch_quote, fetch_options, fetch_movers
from services.news_service import start_news_stream
from core.mcp_client import mcp_client
from core.database import get_portfolio, save_portfolio, get_watchlist, save_watchlist

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIRequest(BaseModel):
    prompt: str
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str = "lms-default"

@app.post("/api/ai/analyze")
async def analyze_market(req: AIRequest):
    scout.initialize_client(
        provider=req.provider, 
        api_key=req.api_key, 
        base_url=req.base_url
    )
    analysis = await scout.get_analysis(req.prompt, req.model_name)
    return {"analysis": analysis}

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_news_stream(sio))
    # Note: MCP connect should gracefully fail and fallback to mock if no MCP container is accessible
    await mcp_client.connect()

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/chart/{ticker}")
async def get_chart(ticker: str, interval: str = "1D"):
    return fetch_candlesticks(ticker, interval)

@app.get("/api/quote/{ticker}")
async def get_quote(ticker: str):
    return fetch_quote(ticker)

@app.get("/api/options/{ticker}")
async def get_options(ticker: str):
    return fetch_options(ticker)

class PromptRequest(BaseModel):
    prompt: str

@app.post("/api/ai")
async def ai_analysis(req: PromptRequest):
    # Pass prompt to MCP server's query_data tool
    result = await mcp_client.query_data(req.prompt)
    return result

@app.get("/api/portfolio/{user_id}")
async def fetch_portfolio(user_id: str):
    return get_portfolio(user_id)

@app.post("/api/portfolio/{user_id}")
async def update_portfolio(user_id: str, symbols: list[str]):
    save_portfolio(user_id, symbols)
    return {"status": "ok"}

@app.get("/api/watchlist/{user_id}")
async def fetch_watchlist(user_id: str):
    return get_watchlist(user_id)

@app.post("/api/watchlist/{user_id}")
async def update_watchlist(user_id: str, symbols: list[str]):
    save_watchlist(user_id, symbols)
    return {"status": "ok"}

@app.get("/api/movers")
async def get_movers():
    # Now hitting the live Massive API!
    return fetch_movers()

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:socket_app", host="0.0.0.0", port=8000, reload=True)
