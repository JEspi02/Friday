/**
 * API & Network Layer
 * Handles fetching, caching, and rate limiting
 */

const Utils = {
    debounce: (func, wait) => { let timeout; return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; },
    formatCurrency: (val) => `$${val.toFixed(2)}`,
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
    baseUrl: 'https://api.polygon.io',
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
        const apiKey = Config.getApiKey();
        
        try {
            const res = await fetch(`${Network.baseUrl}${item.url}&apiKey=${apiKey}`);
            
            if (res.status === 429) {
                if (item.retries < 3) {
                    item.retries++;
                    Network.queue.unshift(item); 
                    setTimeout(() => {
                        Network.isProcessing = false;
                        Network.processQueue();
                    }, 5000 * item.retries);
                } else {
                    Utils.toast('Rate limit exceeded.', 'error');
                    item.reject('Rate Limited');
                    Network.isProcessing = false;
                }
                return;
            }
            
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
        quote: (s) => Network.swr(`q-${s}`, `/v2/aggs/ticker/${s}/prev?adjusted=true`, 5),
        bars: (s, r) => {
            let m = 1, t = 'day', l = 1000;
            if (r === '1m') { m = 1; t = 'minute'; }
            if (r === '5m') { m = 5; t = 'minute'; }
            if (r === '15m') { m = 15; t = 'minute'; }
            if (r === '1h') { m = 1; t = 'hour'; }
            if (r === '4h') { m = 4; t = 'hour'; }
            return Network.swr(`b-${s}-${r}`, `/v2/aggs/ticker/${s}/range/${m}/${t}/${Date.now()-31536000000}/${Date.now()}?adjusted=true&sort=desc&limit=${l}`, 15)
                .then(d => d.results ? d.results.map(b => ({ time: b.t / 1000, open: b.o, high: b.h, low: b.l, close: b.c })).reverse() : []);
        },
        news: (s, l=10) => {
            const q = (s && s !== 'market') ? `ticker=${s}&` : '';
            return Network.swr(`n-${s || 'mkt'}-${l}`, `/v2/reference/news?${q}limit=${l}`, 30)
                .then(d => (d.results || []).map(n => ({ title: n.title, author: n.author, time: n.published_utc, url: n.article_url, img: n.image_url })));
        },
        options: (s) => Network.swr(`opt-${s}`, `/v3/snapshot/options/${s}?limit=250&sort=expiration_date&order=asc`, 15)
            .then(d => {
                if(d.error) return { error: true, code: d.details };
                return d.results || [];
            }),
        search: (q) => Network.addToQueue(`/v3/reference/tickers?search=${q}&active=true&sort=ticker&order=asc&limit=10`).then(d => d.results || [])
    }
};

window.Network = Network;