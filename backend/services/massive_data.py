import os
import json
from datetime import datetime, timezone
from massive import Massive

# In a real setup, we would read the API key from environment, e.g. os.getenv("MASSIVE_API_KEY")
# Initialize Massive SDK client
try:
    client = Massive()
except Exception as e:
    print(f"Failed to initialize Massive SDK: {e}")
    client = None

def fetch_candlesticks(ticker: str, interval: str):
    """
    Fetch historical bars using Massive.
    Gracefully fallback to empty array on failure.
    """
    if not client:
        return {"results": []}

    # Map frontend interval to Massive interval if needed.
    # Frontend passes: 1m, 5m, 15m, 1h, 4h, 1D
    # Massive expects things like: '1m', '5m', '1d', etc.
    try:
        # Example using the massive client (Assuming standard financial API structure)
        # We wrap in try-except to strictly validate and return safe default
        response = client.stocks.get_bars(symbol=ticker, time_frame=interval)

        # Translate to frontend expected format
        # { time: timestamp, open: float, high: float, low: float, close: float }
        results = []
        if response and hasattr(response, 'data') and response.data:
            for bar in response.data:
                results.append({
                    "t": int(bar.timestamp.timestamp() * 1000) if hasattr(bar.timestamp, 'timestamp') else bar.timestamp,
                    "o": bar.open,
                    "h": bar.high,
                    "l": bar.low,
                    "c": bar.close
                })
        return {"results": results}
    except Exception as e:
        print(f"Error fetching candlesticks for {ticker}: {e}")
        return {"results": []}

def fetch_quote(ticker: str):
    """
    Fetch real-time quote.
    Gracefully fallback on failure.
    """
    if not client:
        return {"results": [{"c": 0, "o": 0, "h": 0, "l": 0, "pc": 0, "t": int(datetime.now().timestamp() * 1000)}]}

    try:
        response = client.stocks.get_quote(symbol=ticker)

        # Format for frontend expectation
        # { results: [{ c: quote.regularMarketPrice, ... }] }
        if response and hasattr(response, 'price'):
            return {
                "results": [{
                    "c": response.price,
                    "o": getattr(response, 'open', 0),
                    "h": getattr(response, 'high', 0),
                    "l": getattr(response, 'low', 0),
                    "pc": getattr(response, 'previous_close', 0),
                    "t": int(getattr(response, 'timestamp', datetime.now()).timestamp() * 1000)
                }]
            }

        return {"results": [{"c": 0, "o": 0, "h": 0, "l": 0, "pc": 0, "t": int(datetime.now().timestamp() * 1000)}]}
    except Exception as e:
        print(f"Error fetching quote for {ticker}: {e}")
        return {"results": [{"c": 0, "o": 0, "h": 0, "l": 0, "pc": 0, "t": int(datetime.now().timestamp() * 1000)}]}

def fetch_options(ticker: str):
    """
    Fetch option chains.
    Gracefully fallback on failure.
    """
    if not client:
        return {"results": []}

    try:
        # Pseudo-code for Massive SDK option chains
        response = client.options.get_chains(symbol=ticker)

        results = []
        if response and hasattr(response, 'data'):
            for opt in response.data:
                results.append({
                    "details": {
                        "strike_price": opt.strike,
                        "expiration_date": opt.expiration,
                        "contract_type": opt.type
                    },
                    "last_trade": { "price": getattr(opt, 'last_price', 0) },
                    "last_quote": { "bid": getattr(opt, 'bid', 0), "ask": getattr(opt, 'ask', 0) },
                    "day": { "close": getattr(opt, 'last_price', 0), "volume": getattr(opt, 'volume', 0) },
                    "open_interest": getattr(opt, 'open_interest', 0)
                })
        return {"results": results}
    except Exception as e:
        print(f"Error fetching options for {ticker}: {e}")
        return {"results": []}
