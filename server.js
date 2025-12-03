// Frontend (index.html)
fetch('/api/quote?ticker=AAPL'); 

// Backend (server.js)
app.get('/api/quote', async (req, res) => {
    const ticker = req.query.ticker;
    // The Backend uses the key from .env. The user NEVER sees it.
    const response = await fetch(`https://api.polygon.io...?apiKey=${process.env.POLYGON_KEY}`);
    const data = await response.json();
    res.json(data);
});
