# backend/mcp_server.py

from mcp.server.fastmcp import FastMCP
import sys
import os

# This ensures the script can find your 'services' folder
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.massive_data import fetch_quote, fetch_movers, fetch_candlesticks

# Create the MCP Server
mcp = FastMCP("Massive Tools")

@mcp.tool()
def get_stock_quote(ticker: str) -> str:
    """Get the current real-time stock quote for a given ticker symbol (e.g., AAPL, NVDA)."""
    data = fetch_quote(ticker)
    return str(data)

@mcp.tool()
def get_market_movers() -> str:
    """Get the top 5 gainers and losers in the US stock market today."""
    data = fetch_movers()
    return str(data)

@mcp.tool()
def get_historical_data(ticker: str, interval: str = "1D") -> str:
    """Get historical candlestick chart data for a ticker. Interval can be '1m', '5m', '15m', '1h', '4h', or '1D'."""
    data = fetch_candlesticks(ticker, interval)
    # Convert list of ChartBar models to a readable string for the AI
    return str([bar.model_dump() for bar in data])

if __name__ == "__main__":
    # This tells the script to listen for LM Studio's requests
    mcp.run()