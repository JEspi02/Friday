/**
 * UI Module
 * Handles DOM manipulation and Event Delegation
 */

import State from './state.js';
import Network from './network.js';
import Charts from './charts.js';

// Helper for formatting
const fmt = {
    currency: (v) => `$${(v || 0).toFixed(2)}`,
    pct: (v) => `${v >= 0 ? '+' : ''}${(v || 0).toFixed(2)}%`,
    num: (v) => v ? (v >= 1e6 ? (v/1e6).toFixed(1) + 'M' : (v >= 1e3 ? (v/1e3).toFixed(1) + 'K' : v)) : '-',
    time: (t) => dayjs(t).fromNow()
};

const UI = {
    app: document.getElementById('app-frame'),
    currentView: 'home',

    init: (router) => {
        // Event Delegation for Navigation & Actions
        document.body.addEventListener('click', async (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const payload = target.dataset.payload;

            switch(action) {
                case 'navigate':
                    router.go(payload);
                    break;
                case 'toggle-watchlist':
                    const isAdded = State.toggleWatchlist(payload);
                    State.saveWatchlist();
                    UI.toast(`${payload} ${isAdded ? 'Added' : 'Removed'}`, isAdded ? 'success' : 'info');
                    // Re-render button state if on detail page
                    const btn = document.getElementById('wl-btn-icon');
                    if(btn) btn.className = `fa-heart ${isAdded ? 'fa-solid text-red-500' : 'fa-regular text-gray-400'}`;
                    // Refresh home if there
                    if (UI.currentView === 'home') router.go('home');
                    break;
                case 'chart-type':
                    State.chartType = State.chartType === 'Candles' ? 'Heiken' : 'Candles';
                    target.innerText = State.chartType === 'Candles' ? 'C' : 'HA';
                    Charts.render(State.chartData, State.chartType);
                    break;
                case 'chart-timeframe':
                    State.chartTimeframe = payload;
                    router.go('detail', State.activeSymbol); // Refresh data
                    break;
                case 'zoom':
                    Charts.zoom(payload);
                    break;
                case 'opt-type':
                    State.optionsType = payload;
                    UI.renderOptions(State.activeSymbol, null); // Re-render table
                    break;
                case 'ai-modal':
                    UI.toggleAI(true, payload);
                    break;
                case 'close-ai':
                    UI.toggleAI(false);
                    break;
                case 'news-link':
                    window.open(payload, '_blank');
                    break;
            }
        });

        // Search Input Listener
        document.addEventListener('input', async (e) => {
            if (e.target.id === 'search-input') {
                const val = e.target.value;
                const resContainer = document.getElementById('search-res');
                if (val.length < 1) { resContainer.classList.add('hidden'); return; }

                const results = await Network.search(val);
                resContainer.innerHTML = results.map(r => `
                    <div data-action="navigate" data-payload="detail/${r.ticker}" class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between">
                        <span class="font-bold text-sm">${r.ticker}</span>
                        <span class="text-xs text-gray-500">${r.name.substr(0, 20)}</span>
                    </div>
                `).join('');
                resContainer.classList.remove('hidden');
            }
        });
    },

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

    toggleAI: async (show, type) => {
        const el = document.getElementById('ai-modal');
        el.style.display = show ? 'flex' : 'none';
        if (!show) return;

        const content = document.getElementById('ai-content');
        content.innerHTML = `<div class="flex flex-col items-center justify-center py-8 gap-4"><div class="spinner !border-ai-light !border-t-ai-main"></div><p class="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scouting...</p></div>`;

        // Generate Content based on context
        let prompt = "";
        if (type === 'chart') prompt = `Analyze chart for ${State.activeSymbol}. Close prices: ${State.chartData.slice(-10).map(c=>c.close).join(', ')}`;
        else if (type === 'news') prompt = `Summarize news sentiment for ${State.activeSymbol}. Headlines: ${State.newsData.slice(0,5).map(n=>n.title).join('; ')}`;
        else prompt = `Analyze my portfolio: ${State.portfolio.join(', ')}`;

        const result = await Network.getAIAnalysis(prompt);
        content.innerHTML = marked.parse(result);
    },

    renderHome: async () => {
        const html = `
            ${UI.comps.nav()}
            <main class="content-area bg-[#fdfbf7] p-6 fade-in">
                <div class="max-w-5xl mx-auto">
                    ${UI.comps.header()}
                    ${UI.comps.search()}

                    <div class="mb-8">
                        <div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                            <h2 class="font-bold text-lg text-gray-800">Your Portfolio</h2>
                            <button data-action="ai-modal" data-payload="portfolio" class="scout-btn w-8 h-8 rounded-full flex items-center justify-center"><i class="fa-solid fa-binoculars"></i></button>
                        </div>
                        <div id="pf-list" class="card-grid"><div class="w-full h-24 skeleton mb-3"></div></div>
                    </div>

                    <div class="mb-8">
                        <h2 class="font-bold text-lg text-gray-800 mb-4 border-b border-gray-200 pb-2">Top Movers</h2>
                        <div class="grid grid-cols-1 dt:grid-cols-2 gap-4">
                            <div class="bg-white p-4 rounded-xl border border-gray-100">
                                <h3 class="text-xs font-bold text-gray-400 uppercase mb-2">Gainers</h3>
                                <div id="mv-gain" class="flex flex-col gap-2"></div>
                            </div>
                            <div class="bg-white p-4 rounded-xl border border-gray-100">
                                <h3 class="text-xs font-bold text-gray-400 uppercase mb-2">Losers</h3>
                                <div id="mv-lose" class="flex flex-col gap-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;
        UI.app.innerHTML = html;

        // Fetch Data
        const syms = State.portfolio;
        if(syms.length > 0) {
            const quotes = await Promise.all(syms.map(s => Network.getQuote(s)));
            document.getElementById('pf-list').innerHTML = syms.map((s, i) => {
                const q = quotes[i]?.results?.[0];
                return UI.comps.card(s, {
                    price: q ? q.c : 0,
                    change: q ? ((q.c - q.o)/q.o)*100 : 0
                });
            }).join('');
        } else {
             document.getElementById('pf-list').innerHTML = '<div class="text-sm text-gray-400">Empty</div>';
        }

        const movers = await Network.getMovers();
        const renderMover = (m) => `<div data-action="navigate" data-payload="detail/${m.ticker}" class="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition"><span class="font-bold text-sm">${m.ticker}</span><span class="text-xs font-bold px-1.5 py-0.5 rounded bg-${m.change>=0?'green':'red'}-50 text-${m.change>=0?'green':'red'}-600">${m.change>=0?'+':''}${m.change.toFixed(2)}%</span></div>`;
        if(movers.gainers) document.getElementById('mv-gain').innerHTML = movers.gainers.slice(0,5).map(renderMover).join('');
        if(movers.losers) document.getElementById('mv-lose').innerHTML = movers.losers.slice(0,5).map(renderMover).join('');
    },

    renderDetail: async (ticker) => {
        State.activeSymbol = ticker;
        const html = `
            ${UI.comps.nav()}
            <main class="content-area bg-white fade-in relative">
                 <div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center dt:hidden">
                    <button data-action="navigate" data-payload="home" class="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full"><i class="fa-solid fa-arrow-left text-sm"></i></button>
                    <h1 class="font-bold text-sm">${ticker}</h1>
                    <button data-action="toggle-watchlist" data-payload="${ticker}" class="w-8 h-8 flex items-center justify-center"><i id="wl-btn-icon" class="${State.watchlist.includes(ticker) ? 'fa-solid text-red-500' : 'fa-regular text-gray-400'} fa-heart"></i></button>
                </div>
                ${UI.comps.search()}

                <div class="detail-layout">
                    <div class="detail-chart-col pt-4 dt:pt-0">
                         <div class="hidden dt:flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h1 class="text-4xl font-black text-gray-900 mb-1 flex items-center gap-3">${ticker}</h1>
                                <div class="flex items-center gap-3">
                                    <span id="det-p" class="text-2xl font-bold text-gray-800">---</span>
                                    <span id="det-c" class="text-lg font-bold">---</span>
                                    <button data-action="ai-modal" data-payload="chart" class="scout-btn w-8 h-8 rounded-full flex items-center justify-center ml-2"><i class="fa-solid fa-binoculars"></i></button>
                                </div>
                            </div>
                         </div>

                         <!-- Chart Controls -->
                         <div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 px-5 dt:px-0 items-center">
                            <button data-action="chart-type" class="chart-pill bg-gray-100 text-black border-black font-bold mr-1">C</button>
                            <div class="w-px bg-gray-300 mx-1 h-4"></div>
                            ${['1m','5m','15m','1h','4h','1D'].map(t=>`<button data-action="chart-timeframe" data-payload="${t}" class="chart-pill ${t===State.chartTimeframe?'active':''}">${t}</button>`).join('')}
                            <div class="w-px bg-gray-300 mx-1 h-4"></div>
                            <button data-action="zoom" data-payload="in" class="chart-pill"><i class="fa-solid fa-plus"></i></button>
                            <button data-action="zoom" data-payload="out" class="chart-pill"><i class="fa-solid fa-minus"></i></button>
                         </div>

                         <div id="main-chart" class="w-full h-[300px] dt:h-[450px] border border-gray-100 rounded-xl overflow-hidden relative mb-2 mx-5 dt:mx-0"></div>

                         <!-- News Section -->
                         <div class="mt-6 mx-5 dt:mx-0 border border-gray-100 rounded-xl p-4 bg-white">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="font-bold text-lg flex items-center gap-2">Related News <button data-action="ai-modal" data-payload="news" class="scout-btn w-6 h-6 rounded-full flex items-center justify-center text-xs"><i class="fa-solid fa-binoculars"></i></button></h3>
                            </div>
                            <div id="det-news-grid" class="grid grid-cols-1 dt:grid-cols-2 gap-3 min-h-[100px]"></div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="detail-sidebar-col mt-6 dt:mt-0">
                        <div class="bg-white border border-gray-100 rounded-xl p-4 flex-1 flex flex-col min-h-[400px]">
                            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                                <h3 class="font-bold text-lg">Options Chain</h3>
                                <div class="flex gap-1">
                                    <button data-action="opt-type" data-payload="call" class="px-3 py-1 rounded bg-black text-white text-xs font-bold">Calls</button>
                                    <button data-action="opt-type" data-payload="put" class="px-3 py-1 rounded text-gray-500 hover:bg-gray-100 text-xs font-bold">Puts</button>
                                </div>
                            </div>
                            <div class="overflow-x-auto no-scrollbar">
                                <table class="w-full text-left border-collapse min-w-[350px]">
                                    <thead><tr class="text-xs text-gray-400 border-b border-gray-100"><th class="p-2 sticky left-0 bg-white z-10 shadow-sm">Strike</th><th class="p-2 text-right">Last</th><th class="p-2 text-right">Bid</th><th class="p-2 text-right">Ask</th></tr></thead>
                                    <tbody id="opt-table-body"><tr><td colspan="4" class="p-4 text-center text-xs text-gray-400">Loading...</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;
        UI.app.innerHTML = html;

        // Initialize Chart
        Charts.init('main-chart');

        // Fetch Data Parallel
        const [q, b, o] = await Promise.all([
            Network.getQuote(ticker),
            Network.getBars(ticker, State.chartTimeframe),
            Network.getOptions(ticker)
        ]);

        // Render Header Stats
        const raw = q.results?.[0];
        const price = raw ? raw.c : 0;
        const change = raw ? ((raw.c - raw.o)/raw.o)*100 : 0;
        document.getElementById('det-p').innerText = fmt.currency(price);
        const ce = document.getElementById('det-c');
        ce.innerText = fmt.pct(change);
        ce.style.color = change >= 0 ? '#22c55e' : '#ef4444';

        // Render Chart
        State.chartData = b;
        Charts.render(b);

        // Render Options (Store data first)
        State.optionsData = o;
        UI.renderOptions(ticker, price);

        // Render News (Filtered from global state)
        // Since backend news is global, we filter locally for the ticker
        const related = State.newsData.filter(n =>
            (n.title && n.title.includes(ticker)) ||
            (n.tickers && n.tickers.some(t => t.symbol === ticker))
        );
        document.getElementById('det-news-grid').innerHTML = related.length ? related.slice(0,4).map(n => UI.comps.news(n, true)).join('') : '<div class="col-span-full text-center text-xs text-gray-400">No recent news</div>';
    },

    renderNews: async () => {
        const html = `
            ${UI.comps.nav()}
            <main class="content-area bg-[#fdfbf7] p-6 fade-in">
                <div class="max-w-4xl mx-auto">
                    <h1 class="font-bold text-2xl text-gray-900 mb-6">Live News</h1>
                    ${UI.comps.search()}
                    <div id="news-grid" class="news-grid">
                        ${State.newsData.map(n => UI.comps.news(n)).join('')}
                    </div>
                </div>
            </main>
        `;
        UI.app.innerHTML = html;

        // If empty, fetch
        if(State.newsData.length === 0) {
            const data = await Network.getNews();
            State.setNews(data);
            UI.renderNews(); // Re-render
        }
    },

    renderOptions: (ticker, price) => {
        const tbody = document.getElementById('opt-table-body');
        if(!tbody) return;

        if(!State.optionsData || State.optionsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-xs text-gray-400">No Options Data</td></tr>`;
            return;
        }

        // Filter and Optimization (Show only Near-The-Money)
        const type = State.optionsType;
        const today = dayjs().format('YYYY-MM-DD');
        const nextExpiry = [...new Set(State.optionsData.map(o => o.details.expiration_date))].sort().find(d => d >= today);

        let filtered = State.optionsData.filter(o => o.details.expiration_date === nextExpiry && o.details.contract_type === type);
        filtered.sort((a,b) => a.details.strike_price - b.details.strike_price);

        // Find ATM index
        let atmIdx = 0;
        let minDiff = Infinity;
        if(price) {
            filtered.forEach((o, i) => {
                const diff = Math.abs(o.details.strike_price - price);
                if(diff < minDiff) { minDiff = diff; atmIdx = i; }
            });
            // Slice 10 above and 10 below
            const start = Math.max(0, atmIdx - 10);
            const end = Math.min(filtered.length, atmIdx + 10);
            filtered = filtered.slice(start, end);
        } else {
             filtered = filtered.slice(0, 20);
        }

        tbody.innerHTML = filtered.map(o => {
            const p = o.last_trade?.price || o.day.close || 0;
            return `<tr class="bg-white border-b border-gray-50 hover:bg-gray-50">
                <td class="p-3 text-xs font-bold text-gray-900 sticky left-0 bg-white shadow-sm">${o.details.strike_price}</td>
                <td class="p-3 text-xs text-right font-medium">${fmt.currency(p)}</td>
                <td class="p-3 text-xs text-right text-gray-500">${o.last_quote?.bid || '-'}</td>
                <td class="p-3 text-xs text-right text-gray-500">${o.last_quote?.ask || '-'}</td>
            </tr>`;
        }).join('');
    },

    // UI Components (HTML Strings)
    comps: {
        nav: () => `<nav class="nav-container"><div class="hidden dt:flex items-center gap-3 mb-8 px-2"><div class="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-bold text-lg">F</div><span class="font-bold text-xl tracking-tight">Friday</span></div>${['home','news'].map(p=>`<button data-action="navigate" data-payload="${p}" class="nav-btn ${UI.currentView===p?'active':''}"><i class="fa-solid fa-${p==='home'?'house':'newspaper'}"></i><span>${p.charAt(0).toUpperCase()+p.slice(1)}</span></button>`).join('')}</nav>`,
        header: () => `<header class="flex justify-between items-center mb-6 dt:hidden"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-bold">F</div><h1 class="font-bold text-lg">Friday</h1></div></header>`,
        search: () => `<div class="relative mb-6 z-30 group"><i class="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-gray-400"></i><input id="search-input" type="text" placeholder="Search (e.g. TSLA)..." class="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black transition shadow-sm"><div id="search-res" class="absolute top-14 left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 hidden overflow-hidden z-50"></div></div>`,
        card: (s, q) => {
            const u = q.change >= 0; const c = u ? 'green' : 'red';
            return `<div data-action="navigate" data-payload="detail/${s}" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition group">
                <div class="flex items-center gap-4"><div class="w-10 h-10 rounded-xl bg-${c}-50 flex items-center justify-center font-bold text-${c}-600 border border-${c}-100 group-hover:scale-110 transition">${s[0]}</div><div><h3 class="font-bold text-gray-900">${s}</h3><span class="text-xs text-gray-400 font-medium">Stock</span></div></div>
                <div class="flex flex-col items-end gap-1"><div class="flex items-center gap-2 mt-1"><span class="font-bold text-gray-900 text-lg">${fmt.currency(q.price)}</span><span class="text-xs font-bold px-1.5 py-0.5 rounded bg-${c}-50 text-${c}-600">${fmt.pct(q.change)}</span></div></div>
            </div>`;
        },
        news: (n, compact) => {
            const pills = n.tickers ? n.tickers.map(t => {
                const u = t.change >= 0; const c = u ? 'green' : 'red';
                return `<span class="px-2 py-0.5 text-[10px] font-bold rounded bg-${c}-50 text-${c}-600 border border-${c}-100 flex items-center gap-1">${t.symbol} ${u?'↑':'↓'} ${Math.abs(t.change).toFixed(1)}%</span>`;
            }).join('') : '';

            if (compact) {
                return `<div data-action="news-link" data-payload="${n.url}" class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex flex-col h-full"><h4 class="text-xs font-bold leading-tight mb-2 line-clamp-2">${n.title}</h4><div class="flex flex-wrap gap-1 mb-2">${pills}</div><div class="mt-auto flex items-center gap-2"><span class="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">${n.source || 'News'}</span><span class="text-[10px] text-gray-400">${fmt.time(n.publishedAt)}</span></div></div>`;
            }
            return `<div data-action="news-link" data-payload="${n.url}" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition flex flex-col h-full"><h3 class="font-bold text-sm leading-snug line-clamp-3 mb-2">${n.title}</h3><div class="flex flex-wrap gap-1 mb-3">${pills}</div><div class="mt-auto pt-2 flex items-center gap-2 text-[10px] text-gray-400 font-medium border-t border-gray-50"><span class="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded truncate max-w-[100px]">${n.source || 'News'}</span><span>${fmt.time(n.publishedAt)}</span></div></div>`;
        }
    }
};

export default UI;
