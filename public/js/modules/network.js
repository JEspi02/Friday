/**
 * Network Module
 * Handles communication with the backend API
 */

const Network = {
    // Cache for SWR (Stale-While-Revalidate)
    cache: new Map(),
    queue: [],
    isProcessing: false,

    getCache: (key, expiryMinutes) => {
        if (Network.cache.has(key)) return { value: Network.cache.get(key), isStale: false };
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            const c = JSON.parse(item);
            return { value: c.val, isStale: (Date.now() - c.ts) / 60000 > expiryMinutes };
        } catch(e) { return null; }
    },

    setCache: (key, val) => {
        Network.cache.set(key, val);
        try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), val })); } catch (e) {}
    },

    // Simple fetch wrapper
    fetch: async (endpoint) => {
        try {
            const res = await fetch(`/api${endpoint}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error(`Fetch error for ${endpoint}:`, e);
            throw e;
        }
    },

    // Stale-While-Revalidate Strategy
    swr: async (key, endpoint, expiry = 5) => {
        const c = Network.getCache(key, expiry);
        if (c && !c.isStale) return c.value;

        // Return stale data immediately if available, then fetch fresh
        // Note: For simplicity in this async function, we just fetch if stale/missing
        // Ideally we'd trigger a background fetch update.
        try {
            const data = await Network.fetch(endpoint);
            Network.setCache(key, data);
            return data;
        } catch(e) {
            return c ? c.value : null; // Fallback to stale if fetch fails
        }
    },

    // API Methods
    getQuote: (ticker) => Network.swr(`q-${ticker}`, `/quote/${ticker}`, 1),

    getBars: (ticker, timeframe) => {
        // Timeframe mapping matches server expectation or passed directly
        return Network.swr(`b-${ticker}-${timeframe}`, `/chart/${ticker}?interval=${timeframe}`, 5)
            .then(d => d.results ? d.results.map(b => ({ time: b.t / 1000, open: b.o, high: b.h, low: b.l, close: b.c })).reverse() : []);
    },

    getNews: () => Network.swr('news-feed', '/news', 1).then(d => d || []),

    getMovers: () => Network.swr('movers', '/movers', 5),

    getOptions: (ticker) => Network.swr(`opt-${ticker}`, `/options/${ticker}`, 15)
        .then(d => {
            if(d.error) return { error: true, code: d.details };
            return d.results || [];
        }),

    search: async (query) => {
        if(!query) return [];
        return await Network.fetch(`/search?q=${query}`);
    },

    getAIAnalysis: async (prompt) => {
        try {
            const res = await fetch('/api/ai', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt })
            });
            if(!res.ok) throw new Error('AI API Error');
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis available.";
        } catch (e) {
            console.error(e);
            return "Error generating analysis.";
        }
    }
};

export default Network;