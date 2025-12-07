require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const path = require('path');

// Suppress Yahoo Finance Notice
if (yahooFinance.suppressNotices) {
    yahooFinance.suppressNotices(['yahooSurvey']);
}

// Initialize Realtime News API
let newsApi;
try {
    newsApi = require('realtime-newsapi')();
} catch (e) {
    console.warn("Realtime-NewsAPI not found or failed to initialize. Using mock mode.");
    newsApi = { on: () => {} }; // Mock to prevent crash
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- CACHE & STATE ---
let enrichedArticles = [];

// Function to pre-fill news using Yahoo Finance
const fetchInitialNews = async () => {
    try {
        console.log("Fetching initial market news...");
        // Fetch news for SPY (Market Proxy) to populate the feed
        const result = await yahooFinance.search('SPY', { newsCount: 20 });
        if (result.news) {
            enrichedArticles = result.news.map(n => ({
                title: n.title,
                url: n.link,
                source: n.publisher,
                publishedAt: new Date(n.providerPublishTime * 1000).toISOString(),
                tickers: n.relatedTickers ? n.relatedTickers.map(t => ({ symbol: t, change: 0 })) : []
            }));
            console.log(`Loaded ${enrichedArticles.length} initial news items.`);
        }
    } catch (e) {
        console.error("Failed to load initial news:", e.message);
    }
};

// Call immediately on start
fetchInitialNews();

// --- REALTIME NEWS LOGIC ---
if (newsApi) {
    console.log("Listening for news articles...");
    newsApi.on('articles', async (articles) => {
        try {
            console.log(`Received ${articles.length} articles. Enriching...`);

            const enrichedBatch = await Promise.all(articles.map(async (article) => {
                // 1. Extract tickers (e.g. $TSLA, $AAPL)
                const tickers = article.title ? (article.title.match(/\$[A-Z]+/g) || []) : [];

                // 2. Fetch Yahoo Finance Data for each ticker
                const tickerData = await Promise.all(tickers.map(async (t) => {
                    const symbol = t.replace('$', '');
                    try {
                        const quote = await yahooFinance.quote(symbol);
                        return {
                            symbol,
                            price: quote.regularMarketPrice,
                            change: quote.regularMarketChangePercent
                        };
                    } catch (err) {
                        return { symbol, error: 'No data' };
                    }
                }));

                return {
                    title: article.title,
                    url: article.url,
                    source: article.source, // Assuming source is a string or object with name
                    publishedAt: article.publishedAt || new Date().toISOString(),
                    tickers: tickerData
                };
            }));

            // Update Cache (Keep last 50)
            enrichedArticles = [...enrichedBatch, ...enrichedArticles].slice(0, 50);

            // Emit to Frontend
            io.emit('news-update', enrichedBatch);

        } catch (e) {
            console.error("Error enriching news:", e);
        }
    });
}

// --- API ENDPOINTS ---

// 1. Quotes (Yahoo Finance)
app.get('/api/quote/:ticker', async (req, res) => {
    try {
        const quote = await yahooFinance.quote(req.params.ticker);
        // Map Yahoo format to match what frontend expects (Polygon-ish)
        const data = {
            results: [{
                c: quote.regularMarketPrice,
                o: quote.regularMarketOpen,
                h: quote.regularMarketDayHigh,
                l: quote.regularMarketDayLow,
                pc: quote.regularMarketPreviousClose,
                t: quote.regularMarketTime ? new Date(quote.regularMarketTime).getTime() : Date.now()
            }]
        };
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 6. Top Movers (Gainers/Losers)
app.get('/api/movers', async (req, res) => {
    try {
        const queryOptions = { count: 10, region: 'US', lang: 'en-US' };
        const [gainers, losers] = await Promise.all([
             yahooFinance.screener({ scrIds: 'day_gainers', ...queryOptions }),
             yahooFinance.screener({ scrIds: 'day_losers', ...queryOptions })
        ]);

        // Normalize data
        const format = (list) => list.map(i => ({
            ticker: i.symbol,
            price: i.regularMarketPrice,
            change: i.regularMarketChangePercent
        }));

        res.json({ 
            gainers: format(gainers.quotes || []), 
            losers: format(losers.quotes || []) 
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 7. Search (Autocomplete)
app.get('/api/search', async (req, res) => {
    try {
        const q = req.query.q;
        if(!q) return res.json([]);
        const result = await yahooFinance.search(q);
        const docs = result.quotes
            .filter(q => q.isYahooFinance && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
            .map(q => ({
                ticker: q.symbol,
                name: q.shortname || q.longname || q.symbol
            }));
        res.json(docs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Bars/Charts (Yahoo Finance)
app.get('/api/chart/:ticker', async (req, res) => {
    const { interval = '1d', range = '1mo' } = req.query; 

    // Simple mapper for timeframe
    let yInterval = '1d';
    let yRange = '3mo';

    if (interval === '1m') { yInterval = '1m'; yRange = '1d'; }
    if (interval === '5m') { yInterval = '5m'; yRange = '1d'; }
    if (interval === '15m') { yInterval = '15m'; yRange = '5d'; }
    if (interval === '1h') { yInterval = '60m'; yRange = '1mo'; }
    if (interval === '4h') { yInterval = '60m'; yRange = '3mo'; } 
    if (interval === '1D') { yInterval = '1d'; yRange = '1y'; }

    try {
        const result = await yahooFinance.chart(req.params.ticker, { period1: yRange, interval: yInterval });
        // Map to Polygon format: { results: [{ t, o, h, l, c }, ...] }
        const bars = result.quotes.map(q => ({
            t: new Date(q.date).getTime(),
            o: q.open,
            h: q.high,
            l: q.low,
            c: q.close
        })).filter(b => b.c !== null); // Filter incomplete bars

        res.json({ results: bars });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 3. Options (Yahoo Finance)
app.get('/api/options/:ticker', async (req, res) => {
    try {
        const result = await yahooFinance.options(req.params.ticker, { count: 100 });
        
        // Use the first available expiration for now
        const expirationDate = result.expirationDates[0];
        const options = result.options[0]; // Calls and Puts for first date

        let allOpts = [];

        if (options && options.calls) {
            allOpts = allOpts.concat(options.calls.map(o => ({
                details: {
                    strike_price: o.strike,
                    expiration_date: new Date(expirationDate * 1000).toISOString().split('T')[0],
                    contract_type: 'call'
                },
                last_trade: { price: o.lastPrice },
                last_quote: { bid: o.bid, ask: o.ask },
                day: { close: o.lastPrice, volume: o.volume },
                open_interest: o.openInterest
            })));
        }

        if (options && options.puts) {
            allOpts = allOpts.concat(options.puts.map(o => ({
                details: {
                    strike_price: o.strike,
                    expiration_date: new Date(expirationDate * 1000).toISOString().split('T')[0],
                    contract_type: 'put'
                },
                last_trade: { price: o.lastPrice },
                last_quote: { bid: o.bid, ask: o.ask },
                day: { close: o.lastPrice, volume: o.volume },
                open_interest: o.openInterest
            })));
        }

        res.json({ results: allOpts });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. News (Initial Load)
app.get('/api/news', (req, res) => {
    res.json(enrichedArticles);
});

// 5. AI Proxy (Gemini)
app.post('/api/ai', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const key = process.env.GEMINI_KEY;
        if (!key) throw new Error("Server Gemini Key not configured");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});