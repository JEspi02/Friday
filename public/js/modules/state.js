/**
 * State Module
 * Manages application state (Portfolio, Watchlist, Settings)
 */

const State = {
    portfolio: [],
    watchlist: [],
    activeSymbol: 'AAPL',
    chartTimeframe: '1D',
    chartType: 'Candles',

    // Cache for current view data
    newsData: [],
    optionsData: [],
    optionsType: 'call',

    init: () => {
        State.portfolio = State.load('friday_pf', ['AAPL', 'NVDA', 'SPY', 'AMD']);
        State.watchlist = State.load('friday_wl', []);
    },

    load: (key, fallback) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch(e) { return fallback; }
    },

    save: (key, val) => {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {}
    },

    toggleWatchlist: (ticker) => {
        if (State.watchlist.includes(ticker)) {
            State.watchlist = State.watchlist.filter(t => t !== ticker);
            return false; // Removed
        } else {
            State.watchlist.push(ticker);
            return true; // Added
        }
    },

    saveWatchlist: () => State.save('friday_wl', State.watchlist),

    setNews: (articles) => {
        // Merge and deduplicate
        const current = State.newsData;
        const combined = [...articles, ...current];
        const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
        State.newsData = unique.sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt)).slice(0, 100);
        return State.newsData;
    }
};

export default State;
