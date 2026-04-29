import asyncio
from datetime import datetime

async def start_news_stream(sio):
    """
    Background task to emit news updates to the frontend via socket.io.
    """
    print("Starting news stream...")
    while True:
        await asyncio.sleep(10)

        # Mock news data
        mock_news = [{
            "title": f"Market update {datetime.now().strftime('%H:%M:%S')}",
            "url": "https://example.com/news",
            "source": "Mock News",
            "publishedAt": datetime.now().isoformat() + "Z",
            "tickers": [{"symbol": "AAPL", "change": 0.5}, {"symbol": "SPY", "change": -0.1}]
        }]

        try:
            await sio.emit('news-update', mock_news)
            print(f"Emitted {len(mock_news)} mock news articles")
        except Exception as e:
            print(f"Error emitting news: {e}")
