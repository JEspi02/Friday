from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import asyncio
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Depends
from services.ai_service import scout
from core.auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

from services.massive_data import fetch_candlesticks, fetch_quote, fetch_options, fetch_movers
from services.news_service import start_news_stream
from services.analysis_service import calculate_premium_indicators
from core.mcp_client import mcp_client

from core.models import ChartBar, DrawingCreate, DrawingResponse
from core.database import get_portfolio, save_portfolio, get_watchlist, save_watchlist, save_drawing, get_drawings, delete_drawings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

class AIRequest(BaseModel):
    prompt: str
    provider: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: str = "lms-default"

@app.post("/api/ai/analyze")
async def analyze_market(req: AIRequest):
    # Notice we removed the 'user_id' requirement above
    
    scout.initialize_client(
        provider=req.provider, 
        api_key=req.api_key, 
        base_url=req.base_url
    )
    
    analysis = await scout.get_analysis(req.prompt, req.model_name)
    return {"analysis": analysis}

allowed_sio_origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:5173", "http://127.0.0.1:5173"
]
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=allowed_sio_origins
)
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(start_news_stream(sio))
    # Note: MCP connect should gracefully fail and fallback to mock if no MCP container is accessible
    await mcp_client.connect()

@app.post("/api/auth/login")
async def login():
    # Simple login without credentials for now, representing 'default_user'
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": "default_user"}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/analysis/{ticker}")
def get_analysis(ticker: str, timeframe: str = "1D"):
    bars = fetch_candlesticks(ticker, timeframe)
    return calculate_premium_indicators(bars)

@app.get("/api/chart/{ticker}", response_model=List[ChartBar])
def get_chart(ticker: str, interval: str = "1D"):
    return fetch_candlesticks(ticker, interval)

@app.get("/api/quote/{ticker}")
def get_quote(ticker: str):
    return fetch_quote(ticker)

@app.get("/api/options/{ticker}")
def get_options(ticker: str):
    return fetch_options(ticker)

class PromptRequest(BaseModel):
    prompt: str

@app.post("/api/ai")
async def ai_analysis(req: PromptRequest, user_id: str = Depends(get_current_user)):
    # Pass prompt to MCP server's query_data tool
    result = await mcp_client.query_data(req.prompt)
    return result

@app.get("/api/drawings/{ticker}", response_model=List[DrawingResponse])
async def fetch_drawings(ticker: str, user_id: str = Depends(get_current_user)):
    return get_drawings(user_id, ticker)

@app.post("/api/drawings/{ticker}", response_model=DrawingResponse)
async def create_drawing(ticker: str, drawing: DrawingCreate, user_id: str = Depends(get_current_user)):
    return save_drawing(user_id, ticker, drawing.model_dump())

@app.delete("/api/drawings/{ticker}")
async def remove_drawings(ticker: str, user_id: str = Depends(get_current_user)):
    delete_drawings(user_id, ticker)
    return {"status": "ok"}

@app.get("/api/portfolio")
async def fetch_portfolio(user_id: str = Depends(get_current_user)):
    return get_portfolio(user_id)

@app.post("/api/portfolio")
async def update_portfolio(symbols: list[str], user_id: str = Depends(get_current_user)):
    save_portfolio(user_id, symbols)
    return {"status": "ok"}

@app.get("/api/watchlist")
async def fetch_watchlist(user_id: str = Depends(get_current_user)):
    return get_watchlist(user_id)

@app.post("/api/watchlist")
async def update_watchlist(symbols: list[str], user_id: str = Depends(get_current_user)):
    save_watchlist(user_id, symbols)
    return {"status": "ok"}

@app.get("/api/movers")
def get_movers():
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
