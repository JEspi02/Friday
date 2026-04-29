import os
from datetime import datetime, timedelta
from massive import RESTClient
from dotenv import load_dotenv
from core.database import get_cached_ohlcv, save_ohlcv_batch
from core.models import ChartBar

# 1. Call load_dotenv() to read the .env file
load_dotenv()

# 2. Retrieve the key and initialize the correct RESTClient
try:
    api_key = os.getenv("MASSIVE_API_KEY")
    client = RESTClient(api_key=api_key)
except Exception as e:
    print(f"Failed to initialize Massive RESTClient: {e}")
    client = None

def fetch_candlesticks(ticker: str, interval: str) -> list[ChartBar]:
    """
    Fetch historical bars using Massive's list_aggs method, protected by SQLite caching.
    Dynamically maps frontend intervals to Massive timespans and adjusts the lookback window.
    """
    # First, try to read from the local SQLite cache
    cached_data = get_cached_ohlcv(ticker, interval)
    if cached_data and len(cached_data) > 0:
        return [ChartBar(**bar) for bar in cached_data]

    if not client:
        return []

    # Map frontend interval -> (multiplier, timespan, days_back_to_fetch)
    interval_map = {
        "1m": (1, "minute", 2),     # 2 days of 1-minute data
        "5m": (5, "minute", 5),     # 5 days of 5-minute data
        "15m": (15, "minute", 10),  # 10 days of 15-minute data
        "1h": (1, "hour", 30),      # 30 days of 1-hour data
        "4h": (4, "hour", 60),      # 60 days of 4-hour data
        "1D": (1, "day", 365)       # 1 year of daily data
    }

    # Default to 1D if the interval is somehow unrecognized
    multiplier, timespan, days_back = interval_map.get(interval, (1, "day", 30))

    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        response = client.list_aggs(
            ticker=ticker,
            multiplier=multiplier,
            timespan=timespan, 
            from_=start_date.strftime('%Y-%m-%d'),
            to=end_date.strftime('%Y-%m-%d'),
            limit=50000
        )

        results = []
        if response:
            for bar in response:
                # Store the exact attributes expected by lightweight-charts
                results.append({
                    "time": bar.timestamp,
                    "open": bar.open,
                    "high": bar.high,
                    "low": bar.low,
                    "close": bar.close,
                    "volume": bar.volume if hasattr(bar, 'volume') else 0
                })

            # Save the fresh data to our SQLite cache
            save_ohlcv_batch(ticker, interval, results)

        return [ChartBar(**bar) for bar in results]
    except Exception as e:
        print(f"Error fetching candlesticks for {ticker} ({interval}): {e}")
        return []
    
def fetch_quote(ticker: str):
    """
    Fetch the most recent daily quote data using get_previous_close_agg.
    """
    if not client:
        return {"results": [{"c": 0, "o": 0, "h": 0, "l": 0, "pc": 0, "t": int(datetime.now().timestamp() * 1000)}]}

    try:
        # Retrieve the most recent daily aggregate data for the quote
        prev_close = client.get_previous_close_agg(ticker)

        if prev_close and len(prev_close) > 0:
            agg = prev_close[0]
            return {
                "results": [{
                    "c": agg.close,
                    "o": agg.open,
                    "h": agg.high,
                    "l": agg.low,
                    "pc": agg.close, 
                    "t": agg.timestamp
                }]
            }

        return {"results": [{"c": 0, "o": 0, "h": 0, "l": 0, "pc": 0, "t": int(datetime.now().timestamp() * 1000)}]}
    except Exception as e:
        print(f"Error fetching quote for {ticker}: {e}")
        return {"results": [{"c": 0, "o": 0, "h": 0, "l": 0, "pc": 0, "t": int(datetime.now().timestamp() * 1000)}]}

def fetch_options(ticker: str):
    """
    Fetch option chains (simplified fallback for now).
    """
    return {"results": []}

def fetch_movers():
    """
    Fetch live top gainers and losers from the Massive API.
    """
    if not client:
        return {"gainers": [], "losers": []}

    try:
        # Fetch live snapshot data for US stocks
        gainers_resp = client.get_snapshot_direction("gainers", "us", "stocks")
        losers_resp = client.get_snapshot_direction("losers", "us", "stocks")

        # Parse the top 5 results and format them for our frontend
        gainers = []
        if gainers_resp:
            for g in gainers_resp[:5]:
                gainers.append({
                    "ticker": g.ticker, 
                    "price": getattr(g.day, 'close', 0) if g.day else 0, 
                    "change": getattr(g, 'todays_change_perc', 0)
                })

        losers = []
        if losers_resp:
            for l in losers_resp[:5]:
                losers.append({
                    "ticker": l.ticker, 
                    "price": getattr(l.day, 'close', 0) if l.day else 0, 
                    "change": getattr(l, 'todays_change_perc', 0)
                })

        return {"gainers": gainers, "losers": losers}
    except Exception as e:
        print(f"Error fetching live movers: {e}")
        return {"gainers": [], "losers": []}