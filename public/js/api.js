/**
 * API & Network Layer
 * Handles fetching, caching, and rate limiting
 * Refactored to point to local Backend API
 */

const Utils = {
    debounce: (func, wait) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; },
    formatCurrency: (val) => `$${(val || 0).toFixed(2)}`,
    formatNumber: (num) => num ? (num >= 1e6 ? (num/1e6).toFixed(1) + 'M' : (num >= 1e3 ? (num/1e3).toFixed(1) + 'K' : num)) : '-',
    safeParse: (key, fallback) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : fallback; } catch(e) { return fallback; } },
    toast: (msg, type = 'info') => { 
        const c = document.getElementById('toast-container');
        if(!c) return;
        const el = document.createElement('div'); 
        el.className = `toast ${type}`; 
        el.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation text-red-500' : (type === 'ai' ? 'fa-binoculars text-purple-500' : 'fa-check-circle text-green-500')}"></i><span class="text-sm font-bold">${msg}</span>`; 
        if(type === 'ai') el.style.borderLeftColor = '#8b5cf6';
        c.appendChild(el); 
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; setTimeout(() => el.remove(), 300); }, 3000); 
    },
    paginate: (items, page, perPage) => { 
        const start = (page - 1) * perPage, end = start + perPage; 
        return { data: items.slice(start, end), meta: { current: page, total: Math.ceil(items.length / perPage), hasPrev: page > 1, hasNext: end < items.length } }; 
    }
};
window.Utils = Utils;

const Network = {
    // Points to local backend now
    baseUrl: '/api',
    queue: [],
    isProcessing: false,
    cache: new Map(),

    getCache: (key, expiryMinutes) => { 
        if (Network.cache.has(key)) return { value: Network.cache.get(key), isStale: false }; 
        const c = Utils.safeParse(key, null); 
        if (!c) return null; 
        return { value: c.val, isStale: (Date.now() - c.ts) / 60000 > expiryMinutes }; 
    },
    setCache: (key, val) => { 
        Network.cache.set(key, val); 
        try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), val })); } catch (e) {} 
    },

    addToQueue: (url) => {
        return new Promise((resolve, reject) => {
            Network.queue.push({ url, resolve, reject, retries: 0 });
            Network.processQueue();
        });
    },
    
    processQueue: async () => {
        if (Network.isProcessing || Network.queue.length === 0) return;
        Network.isProcessing = true;
        
        const item = Network.queue.shift();
        
        try {
            const res = await fetch(`${Network.baseUrl}${item.url}`);
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            item.resolve(data);
            
        } catch (e) {
            item.reject(e);
        }
        
        setTimeout(() => {
            Network.isProcessing = false;
            Network.processQueue();
        }, 350); 
    },

    swr: async (key, fetchUrl, expiry = 15) => {
        const c = Network.getCache(key, expiry);
        if (c && !c.isStale) return c.value;
        try {
            const d = await Network.addToQueue(fetchUrl);
            if (d) Network.setCache(key, d);
            return d;
        } catch(e) {
            return c ? c.value : { error: true, details: e.message };
        }
    },

    endpoints: {
        quote: (s) => Network.swr(`q-${s}`, `/quote/${s}`, 1),
        bars: (s, r) => {
            return Network.swr(`b-${s}-${r}`, `/chart/${s}?interval=${r}`, 5)
                .then(d => d.results ? d.results.map(b => ({ time: b.t / 1000, open: b.o, high: b.h, low: b.l, close: b.c })).reverse() : []);
        },
        // News now fetches enriched articles from backend
        news: (s, l=10) => {
            // If specific ticker, filter locally or ask backend (backend implementation is global news for now)
            // For now, we fetch global news and filter client side if needed, or just return global
            return Network.swr(`news-feed`, `/news`, 1)
                .then(d => d || []);
        },
        movers: () => Network.swr('movers', '/movers', 5),
        options: (s) => Network.swr(`opt-${s}`, `/options/${s}`, 15)
            .then(d => {
                if(d.error) return { error: true, code: d.details };
                return d.results || [];
            }),
        search: (q) => Network.addToQueue(`/search?q=${q}`)
    }
};

window.Network = Network;
