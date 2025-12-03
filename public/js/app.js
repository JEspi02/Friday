/**
 * Main Application Logic
 * Integrates Data, State, Charts, UI, and Gemini AI
 */

const App = {
    
    // --- CORE ---
    Core: {
        init: () => {
            App.UI.router.go('home');
            setTimeout(() => document.getElementById('preloader').style.opacity = '0', 500);
            setTimeout(() => document.getElementById('preloader').remove(), 1000);
        }
    },

    // --- GEMINI AI MODULE ---
    Gemini: {
        generate: async (prompt) => {
            const apiKey = Config.getGeminiKey();
            const keyParam = apiKey ? `?key=${apiKey}` : `?key=`; 
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent${keyParam}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                
                if(!response.ok) throw new Error('AI API Error');
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis available.";
            } catch (e) {
                console.error(e);
                return "Error: Could not generate AI insight. Please check your Gemini API Key in Settings.";
            }
        },
        analyzeComprehensive: async (ticker, data, indicators, comparisons) => {
            const lastPrice = data[data.length - 1].close;
            const recent = data.slice(-15).map(d => `${new Date(d.time*1000).toISOString().split('T')[0]}: ${d.close}`).join(', ');
            
            let compContext = "No comparison tickers active.";
            if (comparisons && comparisons.length > 0) {
                compContext = `Compared to: ${comparisons.map(c => `${c.symbol} (Last: ${c.last})`).join(', ')}.`;
            }

            const prompt = `
                As a senior technical analyst, analyze ${ticker}.
                **Context:**
                - Recent Close Prices: [${recent}]
                - Current indicators: ${indicators}
                - ${compContext}

                **Task:**
                1. **Trend Analysis:** Identify the immediate and secondary trend.
                2. **Key Levels:** Identify support/resistance.
                3. **Indicator Check:** Interpret the indicators provided.
                4. **Correlation:** If comparison data is present, analyze relative strength.
                
                Format in concise Markdown with bold headers.
            `;
            return await App.Gemini.generate(prompt);
        },
        analyzeNews: async (ticker, news) => {
            const headlines = news.slice(0, 10).map(n => `- ${n.title}`).join('\n');
            const prompt = `
                Analyze the following news headlines for ${ticker}:
                ${headlines}

                Provide a summary categorized exactly as follows:
                ### Positive Highlights
                (Bulleted list of bullish factors)

                ### Negative Highlights
                (Bulleted list of bearish factors or risks)

                If neutral, state "Market sentiment appears neutral."
            `;
            return await App.Gemini.generate(prompt);
        },
        analyzePortfolio: async (items) => {
            const context = items.map(i => `${i.ticker}: ${i.change > 0 ? '+' : ''}${i.change.toFixed(2)}%`).join('\n');
            const prompt = `
                Here is the daily performance of my portfolio/watchlist:
                ${context}

                **Task:**
                1. **Daily Rundown:** Summarize the overall performance (Bullish/Bearish/Mixed). Who were the leaders and laggards?
                2. **Sentiment Check:** Based on general market knowledge of these tickers, explain why they might be moving (e.g. "Tech sector rally", "Earnings anticipation").
                3. **Potential Plays:** Suggest 1-2 potential options or stock plays for the week based on this momentum (e.g. "Consider calls on [Ticker] if it breaks resistance").

                Keep it concise, professional, and use Markdown.
            `;
            return await App.Gemini.generate(prompt);
        }
    },

    // --- DATA & MATH ---
    Data: {
        calculateHeikenAshi: (data) => {
            if(data.length === 0) return [];
            const haData = [];
            let prevOpen = data[0].open, prevClose = data[0].close;
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                const close = (d.open + d.high + d.low + d.close) / 4;
                const open = (prevOpen + prevClose) / 2;
                const high = Math.max(d.high, Math.max(open, close));
                const low = Math.min(d.low, Math.min(open, close));
                haData.push({ time: d.time, open, high, low, close });
                prevOpen = open; prevClose = close;
            }
            return haData;
        },
        calculateSupertrend: (data, period = 10, multiplier = 3) => {
            const res = [];
            let tr = new Array(data.length).fill(0), atr = new Array(data.length).fill(0);
            let upperBand = new Array(data.length).fill(0), lowerBand = new Array(data.length).fill(0);
            let trend = 1;
            for(let i = 1; i < data.length; i++) {
                tr[i] = Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close));
                if(i < period) atr[i] = tr[i]; 
                else { let sum = 0; for(let j=0; j<period; j++) sum += tr[i-j]; atr[i] = sum/period; }
                const hl2 = (data[i].high + data[i].low) / 2;
                let ub = hl2 + (multiplier * atr[i]), lb = hl2 - (multiplier * atr[i]);
                if (i > 0) {
                    if (data[i].close > upperBand[i-1]) upperBand[i] = ub; else upperBand[i] = Math.min(ub, upperBand[i-1]);
                    if (data[i].close < lowerBand[i-1]) lowerBand[i] = lb; else lowerBand[i] = Math.max(lb, lowerBand[i-1]);
                }
                if(data[i].close > upperBand[i-1]) trend = 1; else if(data[i].close < lowerBand[i-1]) trend = -1;
                res.push({ time: data[i].time, value: trend === 1 ? lowerBand[i] : upperBand[i], color: trend === 1 ? '#22c55e' : '#ef4444' });
            }
            return res;
        },
        getIndicatorState: (data, activeSet) => {
            let summary = [];
            if (activeSet.has('SMA')) {
                const sum = data.slice(-20).reduce((a,b)=>a+b.close,0);
                summary.push(`SMA(20): ${(sum/20).toFixed(2)}`);
            }
            if (activeSet.has('RSI')) {
                summary.push("RSI (Active)"); 
            }
            return summary.length ? summary.join(', ') : "None active";
        }
    },

    // --- STATE MANAGEMENT ---
    State: {
        portfolio: null, watchlist: null, lastAddTimestamp: null,
        activeSymbol: 'AAPL', chartTimeframe: '1D', chartType: 'Candles',
        chartData: [], activeOverlays: new Set(), activeBottom: null,
        newsData: [], newsPage: 1, newsFilter: 'market',
        optionsData: [], optionsType: 'call', detailNewsPage: 1,
        comparisons: new Set(),

        init: () => {
            // Uses global Utils and Config
            App.State.portfolio = Utils.safeParse(Config.storageKeys.portfolio, ['AAPL', 'NVDA', 'SPY', 'AMD']);
            App.State.watchlist = Utils.safeParse(Config.storageKeys.watchlist, []);
            App.State.lastAddTimestamp = Utils.safeParse(Config.storageKeys.lastAdd, 0);
        },
        
        toggleWatchlist: (s) => {
            const icon = document.getElementById('wl-btn-icon');
            const detailIcon = document.getElementById('wl-btn-icon-dt');
            
            if (App.State.watchlist.includes(s)) {
                App.State.watchlist = App.State.watchlist.filter(x => x !== s);
                Utils.toast(`${s} removed`, 'info');
                if (icon) { icon.className = 'fa-regular text-gray-400 fa-heart text-xl'; icon.classList.remove('text-red-500', 'fa-solid'); }
                if (detailIcon) { detailIcon.className = 'fa-regular text-gray-400 fa-heart text-xl'; detailIcon.classList.remove('text-red-500', 'fa-solid'); }
            } else {
                App.State.watchlist.push(s);
                Utils.toast(`${s} added`, 'success');
                if (icon) { icon.className = 'fa-solid text-red-500 fa-heart text-xl'; icon.classList.remove('text-gray-400', 'fa-regular'); }
                if (detailIcon) { detailIcon.className = 'fa-solid text-red-500 fa-heart text-xl'; detailIcon.classList.remove('text-gray-400', 'fa-regular'); }
            }
            localStorage.setItem(Config.storageKeys.watchlist, JSON.stringify(App.State.watchlist));
        }
    },

    // --- CHART MANAGER ---
    Charts: {
        mainChart: null, series: null, bottomChart: null, resizeObs: null, seriesMap: new Map(),

        cleanup: () => {
            if (App.Charts.resizeObs) { App.Charts.resizeObs.disconnect(); App.Charts.resizeObs = null; }
            if (App.Charts.mainChart) { App.Charts.mainChart.remove(); App.Charts.mainChart = null; App.Charts.series = null; }
            if (App.Charts.bottomChart) { App.Charts.bottomChart.destroy(); App.Charts.bottomChart = null; }
            App.Charts.seriesMap.clear(); App.State.comparisons.clear();
        },

        initMain: (id, data) => {
            const el = document.getElementById(id); if (!el) return; el.innerHTML = '';
            const renderData = App.State.chartType === 'Heiken' ? App.Data.calculateHeikenAshi(data) : data;
            const chart = LightweightCharts.createChart(el, { layout: { background: { color: '#ffffff' }, textColor: '#333' }, grid: { vertLines: { visible: false }, horzLines: { color: '#f0f0f0' } }, rightPriceScale: { borderVisible: false }, timeScale: { borderVisible: false }, height: 300 });
            const series = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', borderVisible: false, wickUpColor: '#22c55e', wickDownColor: '#ef4444' });
            series.setData(renderData); chart.timeScale().fitContent();
            
            App.Charts.mainChart = chart; App.Charts.series = series;
            App.Charts.resizeObs = new ResizeObserver(e => { if(e[0].contentRect && App.Charts.mainChart) App.Charts.mainChart.applyOptions({ width: e[0].contentRect.width, height: e[0].contentRect.height }); });
            App.Charts.resizeObs.observe(el);

            App.State.activeOverlays.forEach(type => App.Charts.addOverlay(type, true));
            if (App.State.activeBottom) App.Charts.setBottom(App.State.activeBottom);
        },

        zoom: (dir) => {
            if(!App.Charts.mainChart) return;
            const ts = App.Charts.mainChart.timeScale(), r = ts.getVisibleLogicalRange();
            if(!r) return;
            const span = r.to - r.from, factor = 0.2;
            ts.setVisibleLogicalRange({ from: r.from + span * factor * (dir === 'in' ? 1 : -1), to: r.to - span * factor * (dir === 'in' ? 1 : -1) });
        },

        toggleType: () => {
            App.State.chartType = App.State.chartType === 'Candles' ? 'Heiken' : 'Candles';
            const el = document.getElementById('chart-type-btn'); if(el) el.innerText = App.State.chartType === 'Candles' ? 'C' : 'HA';
            App.Charts.initMain('main-chart', App.State.chartData);
        },

        addComparison: async (ticker) => {
            ticker = ticker.toUpperCase();
            if(!ticker || !App.Charts.mainChart) return;
            Utils.toast(`Fetching ${ticker}...`, 'info');
            const bars = await Network.endpoints.bars(ticker, App.State.chartTimeframe);
            if(bars.length === 0) { Utils.toast('No data found', 'error'); return; }
            const lineSeries = App.Charts.mainChart.addLineSeries({ color: '#a855f7', lineWidth: 2, priceScaleId: 'right' });
            lineSeries.setData(bars.map(b => ({ time: b.time, value: b.close })));
            App.State.comparisons.add(ticker); App.UI.toggleLibrary(false); Utils.toast(`Added ${ticker}`, 'success');
        },

        toggleOverlay: (type) => {
            if (App.State.activeOverlays.has(type)) {
                App.State.activeOverlays.delete(type);
                const s = App.Charts.seriesMap.get(type); if(s) App.Charts.mainChart.removeSeries(s);
                document.getElementById(`btn-${type}`).classList.remove('active');
            } else {
                App.State.activeOverlays.add(type); App.Charts.addOverlay(type, true);
                document.getElementById(`btn-${type}`).classList.add('active');
            }
        },

        addOverlay: (type, skipUI) => {
            if (!App.Charts.mainChart || App.State.chartData.length === 0) return;
            if (!skipUI) App.UI.toggleLibrary(false);
            const pInput = document.getElementById('ind-period');
            const p = pInput ? parseInt(pInput.value) || 20 : 20;
            const d = App.State.chartData; let ld = [], series;
            
            if (type === 'Supertrend') {
                const stData = App.Data.calculateSupertrend(d, p, 3);
                series = App.Charts.mainChart.addLineSeries({ color: '#22c55e', lineWidth: 2 });
                series.setData(stData.map(x => ({ time: x.time, value: x.value, color: x.color })));
            } else {
                if (type === 'SMA') { for (let i = p - 1; i < d.length; i++) { let s = 0; for (let j = 0; j < p; j++) s += d[i - j].close; ld.push({ time: d[i].time, value: s / p }); } }
                else if (type === 'EMA') { const k = 2 / (p + 1); let e = d[0].close; for (let i = 0; i < d.length; i++) { e = d[i].close * k + e * (1 - k); if (i >= p) ld.push({ time: d[i].time, value: e }); } }
                else if (type === 'Bollinger') { for (let i = p - 1; i < d.length; i++) { let s = 0; for (let j = 0; j < p; j++) s += d[i - j].close; ld.push({ time: d[i].time, value: (s / p) * 1.05 }); } } 
                else if (type === 'VWAP') { const v = d.reduce((a, b) => a + b.close, 0) / d.length; ld = d.map(x => ({ time: x.time, value: v })); }
                series = App.Charts.mainChart.addLineSeries({ color: type === 'SMA' ? '#3b82f6' : type === 'EMA' ? '#8b5cf6' : '#f97316', lineWidth: 2 });
                series.setData(ld);
            }
            App.Charts.seriesMap.set(type, series);
        },

        toggleBottom: (type) => {
            if (App.State.activeBottom === type) {
                App.State.activeBottom = null;
                document.getElementById('btm-chart-cont').classList.add('hidden');
                if (App.Charts.bottomChart) { App.Charts.bottomChart.destroy(); App.Charts.bottomChart = null; }
                document.getElementById(`btn-${type}`).classList.remove('active');
            } else {
                if(App.State.activeBottom) document.getElementById(`btn-${App.State.activeBottom}`).classList.remove('active');
                App.State.activeBottom = type; App.Charts.setBottom(type);
                document.getElementById(`btn-${type}`).classList.add('active');
            }
        },

        setBottom: (type) => {
            const d = App.State.chartData, p = 14; 
            if (!d || d.length <= p) return;
            const cont = document.getElementById('btm-chart-cont'); cont.classList.remove('hidden');
            const ctx = document.getElementById('btm-chart');
            if (App.Charts.bottomChart) App.Charts.bottomChart.destroy();
            
            let lbl = d.map(() => ''), val = [];
            if (type === 'RSI') {
                let g = 0, l = 0; for (let i = 1; i <= p; i++) { const c = d[i].close - d[i - 1].close; if (c > 0) g += c; else l -= c; }
                let ag = g / p, al = l / p;
                for (let i = p + 1; i < d.length; i++) { const c = d[i].close - d[i - 1].close; ag = (ag * (p - 1) + (c > 0 ? c : 0)) / p; al = (al * (p - 1) + (c < 0 ? -c : 0)) / p; val.push(100 - (100 / (1 + ag / al))); }
                lbl = lbl.slice(p + 1);
            } else if (type === 'MACD') { val = d.map(x => x.close - x.open); }
            
            App.Charts.bottomChart = new Chart(ctx, {
                type: type === 'MACD' ? 'bar' : 'line',
                data: { labels: lbl, datasets: [{ label: type, data: val, borderColor: '#1a1a1a', backgroundColor: type === 'MACD' ? (c => c.raw >= 0 ? '#22c55e' : '#ef4444') : 'transparent', tension: 0.1, pointRadius: 0, borderWidth: 1.5 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { grid: { display: false } } } }
            });
        },
        
        clearAll: () => {
            App.State.activeOverlays.forEach(type => App.Charts.toggleOverlay(type));
            if (App.State.activeBottom) App.Charts.toggleBottom(App.State.activeBottom);
            Utils.toast('Indicators Cleared', 'info');
        },
        
        updateActiveIndicators: Utils.debounce(() => {
            App.State.activeOverlays.forEach(type => {
                const s = App.Charts.seriesMap.get(type); if(s) App.Charts.mainChart.removeSeries(s);
                App.Charts.addOverlay(type, true);
            });
            if(App.State.activeBottom) App.Charts.setBottom(App.State.activeBottom);
        }, 300)
    },

    // --- UI MANAGER ---
    UI: {
        app: document.getElementById('app-frame'),
        curr: 'home',
        toggleLibrary: (s) => document.getElementById('ind-library').style.display = s ? 'flex' : 'none',
        
        toggleAI: (s) => {
            const el = document.getElementById('ai-modal');
            el.style.display = s ? 'flex' : 'none';
            if(!s) document.getElementById('ai-content').innerHTML = `<div class="flex flex-col items-center justify-center py-8 gap-4"><div class="spinner !border-ai-light !border-t-ai-main"></div><p class="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scouting Market Data...</p></div>`;
        },

        showAI: async (type, data) => {
            App.UI.toggleAI(true);
            let result = "";
            if(type === 'chart') {
                const indicators = App.Data.getIndicatorState(App.State.chartData, App.State.activeOverlays);
                const comps = Array.from(App.State.comparisons).map(c => ({ symbol: c, last: 'Unknown' })); 
                result = await App.Gemini.analyzeComprehensive(App.State.activeSymbol, App.State.chartData, indicators, comps);
            }
            else if(type === 'news') result = await App.Gemini.analyzeNews(App.State.activeSymbol, App.State.newsData);
            else if(type === 'portfolio') {
                const syms = [...new Set([...App.State.portfolio, ...App.State.watchlist])];
                if (syms.length === 0) { result = "Add stocks to your portfolio or watchlist to scout for plays."; }
                else {
                    const quotes = await Promise.all(syms.map(s => Network.endpoints.quote(s)));
                    const summary = syms.map((s, i) => {
                        const q = quotes[i]?.results?.[0];
                        return { ticker: s, change: q ? ((q.c - q.o)/q.o)*100 : 0 };
                    });
                    result = await App.Gemini.analyzePortfolio(summary);
                }
            }
            document.getElementById('ai-content').innerHTML = marked.parse(result);
        },

        comps: {
            searchBar: () => `<div class="relative mb-6 z-30 group" tabindex="0" onblur="setTimeout(()=>{const e=document.getElementById('search-res');if(e)e.classList.add('hidden')}, 200)"><i class="fa-solid fa-magnifying-glass absolute left-4 top-3.5 text-gray-400"></i><input type="text" placeholder="Search (e.g. TSLA)..." class="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black transition shadow-sm" oninput="App.UI.handleSearch(this.value)"><div id="search-res" class="absolute top-14 left-0 w-full bg-white rounded-xl shadow-xl border border-gray-100 hidden overflow-hidden z-50"></div></div>`,
            nav: () => `<nav class="nav-container"><div class="hidden dt:flex items-center gap-3 mb-8 px-2"><div class="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-bold text-lg">F</div><span class="font-bold text-xl tracking-tight">Friday</span></div>${['home','trade','news','profile'].map(p=>`<button onclick="App.UI.router.go('${p}')" class="nav-btn ${App.UI.curr===p?'active':''}"><i class="fa-solid fa-${p==='home'?'house':p==='trade'?'arrow-trend-up':p==='news'?'newspaper':'user'}"></i><span>${p.charAt(0).toUpperCase()+p.slice(1)}</span></button>`).join('')}</nav>`,
            card: (s, q) => { const u = q.change >= 0, c = u ? 'green' : 'red'; return `<div onclick="App.UI.router.go('detail','${s}')" class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition group"><div class="flex items-center gap-4"><div class="w-10 h-10 rounded-xl bg-${c}-50 flex items-center justify-center font-bold text-${c}-600 border border-${c}-100 group-hover:scale-110 transition">${s[0]}</div><div><h3 class="font-bold text-gray-900">${s}</h3><span class="text-xs text-gray-400 font-medium">Stock</span></div></div><div class="flex flex-col items-end gap-1"><div class="flex items-center gap-2 mt-1"><span class="font-bold text-gray-900 text-lg">${Utils.formatCurrency(q.price)}</span><span class="text-xs font-bold px-1.5 py-0.5 rounded bg-${c}-50 text-${c}-600">${u?'+':''}${q.change.toFixed(2)}%</span></div></div></div>`; },
            news: (n, compact) => compact ? `<div onclick="window.open('${n.url}')" class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex flex-col h-full"><h4 class="text-xs font-bold leading-tight mb-2 line-clamp-2">${n.title}</h4><div class="mt-auto flex items-center gap-2"><span class="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">${n.author}</span><span class="text-[10px] text-gray-400">${dayjs(n.time).fromNow()}</span></div></div>` : `<div onclick="window.open('${n.url}','_blank')" class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition flex flex-col h-full"><div class="flex justify-between items-start gap-4 mb-2"><h3 class="font-bold text-sm leading-snug line-clamp-3">${n.title}</h3>${n.img ? `<div class="w-16 h-16 bg-gray-100 rounded-lg bg-cover bg-center shrink-0" style="background-image:url('${n.img}')"></div>` : ''}</div><div class="mt-auto pt-2 flex items-center gap-2 text-[10px] text-gray-400 font-medium border-t border-gray-50"><span class="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded truncate max-w-[80px]">${n.author}</span><span>${dayjs(n.time).fromNow()}</span></div></div>`,
            optRow: (o, p) => { const isCall = o.details.contract_type === 'call', isITM = isCall ? (p > o.details.strike_price) : (p < o.details.strike_price); return `<tr class="opt-row ${isITM ? (isCall ? 'opt-itm-call' : 'opt-itm-put') : 'bg-white'}"><td class="p-3 text-xs font-bold text-gray-900 sticky left-0 bg-white z-10 shadow-sm">${o.details.strike_price}</td><td class="p-3 text-xs text-right font-medium">${(o.last_trade?.price || o.day.close || '-')}</td><td class="p-3 text-xs text-right text-gray-500">${o.last_quote?.bid || '-'}</td><td class="p-3 text-xs text-right text-gray-500">${o.last_quote?.ask || '-'}</td><td class="p-3 text-xs text-right text-gray-500">${Utils.formatNumber(o.day.volume)}</td><td class="p-3 text-xs text-right text-gray-500">${Utils.formatNumber(o.open_interest)}</td></tr>`; }
        },

        handleSearch: Utils.debounce(async (v) => {
            const el = document.getElementById('search-res');
            if (v.length < 1) { el.classList.add('hidden'); return; }
            const r = await Network.endpoints.search(v.toUpperCase());
            el.innerHTML = r.map(x => `<div onclick="App.UI.router.go('detail','${x.ticker}')" class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between"><span class="font-bold text-sm">${x.ticker}</span><span class="text-xs text-gray-500">${x.name.substr(0, 15)}</span></div>`).join('');
            el.classList.remove('hidden');
        }, 500),

        // Views
        views: {
            home: async () => {
                App.UI.curr = 'home';
                App.UI.app.innerHTML = `${App.UI.comps.nav()}<main class="content-area bg-[#fdfbf7] p-6 fade-in"><div class="max-w-5xl mx-auto"><header class="flex justify-between items-center mb-6 dt:hidden"><div class="flex items-center gap-2"><div class="w-8 h-8 bg-black text-white rounded flex items-center justify-center font-bold">F</div><h1 class="font-bold text-lg">Friday</h1></div><div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">${Config.getApiKey().slice(0,2)}</div></header>${App.UI.comps.searchBar()}<div class="mb-8"><div class="flex justify-between items-center mb-4 border-b border-gray-200 pb-2"><h2 class="font-bold text-lg text-gray-800">Your Portfolio</h2><button onclick="App.UI.showAI('portfolio')" class="scout-btn w-8 h-8 rounded-full flex items-center justify-center"><i class="fa-solid fa-binoculars"></i></button></div><div id="pf-list" class="card-grid"><div class="w-full h-24 skeleton mb-3"></div></div></div><div><h2 class="font-bold text-lg text-gray-800 mb-4 border-b border-gray-200 pb-2">Watchlist</h2><div id="wl-list" class="card-grid"><div class="w-full h-24 skeleton mb-3"></div></div></div></div></main>`;
                
                const syms = [...new Set([...App.State.portfolio, ...App.State.watchlist])];
                if (syms.length === 0) { document.getElementById('pf-list').innerHTML = '<div class="text-sm text-gray-400">Empty</div>'; return; }
                const q = await Promise.all(syms.map(s => Network.endpoints.quote(s)));
                const rend = (id, l) => document.getElementById(id).innerHTML = l.length ? l.map(s => App.UI.comps.card(s, q[syms.indexOf(s)]?.results?.[0] ? { price: q[syms.indexOf(s)].results[0].c, change: ((q[syms.indexOf(s)].results[0].c - q[syms.indexOf(s)].results[0].o) / q[syms.indexOf(s)].results[0].o) * 100 } : { price: 0, change: 0 })).join('') : '<div class="p-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl w-full">Empty</div>';
                rend('pf-list', App.State.portfolio); rend('wl-list', App.State.watchlist);
            },
            detail: async (s) => {
                App.Charts.cleanup(); App.UI.curr = 'detail'; App.State.activeSymbol = s; App.State.optionsType = 'call'; App.State.detailNewsPage = 1;
                
                App.UI.app.innerHTML = `${App.UI.comps.nav()}<main class="content-area bg-white fade-in relative"><div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center dt:hidden"><button onclick="App.UI.router.go('home')" class="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full"><i class="fa-solid fa-arrow-left text-sm"></i></button><h1 class="font-bold text-sm">${s}</h1><button onclick="App.State.toggleWatchlist('${s}')" class="w-8 h-8 flex items-center justify-center"><i id="wl-btn-icon" class="${App.State.watchlist.includes(s) ? 'fa-solid text-red-500' : 'fa-regular text-gray-400'} fa-heart"></i></button></div>${App.UI.comps.searchBar()}<div class="detail-layout"><div class="detail-chart-col pt-4 dt:pt-0"><div class="hidden dt:flex justify-between items-center mb-6 border-b border-gray-100 pb-4"><div><h1 class="text-4xl font-black text-gray-900 mb-1 flex items-center gap-3">${s} <span class="text-sm font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded align-middle tracking-normal">US MARKET</span></h1><div class="flex items-center gap-3"><span id="det-p" class="text-2xl font-bold text-gray-800">---</span><span id="det-c" class="text-lg font-bold">---</span><button onclick="App.UI.showAI('chart')" class="scout-btn w-8 h-8 rounded-full flex items-center justify-center ml-2"><i class="fa-solid fa-binoculars"></i></button></div></div><div class="flex gap-3"><button onclick="App.State.toggleWatchlist('${s}')" class="w-10 h-10 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center transition"><i id="wl-btn-icon-dt" class="${App.State.watchlist.includes(s) ? 'fa-solid text-red-500' : 'fa-regular text-gray-400'} fa-heart text-xl"></i></button><button onclick="App.UI.router.go('trade','${s}')" class="px-6 py-2 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg">Trade</button></div></div><div class="dt:hidden px-5 mb-4"><h1 class="text-3xl font-black text-gray-900 mb-1" id="det-p-m">---</h1><div class="flex items-center gap-2"><span id="det-c-m" class="font-bold text-sm">--%</span></div></div><div class="flex gap-2 overflow-x-auto no-scrollbar mb-4 px-5 dt:px-0 items-center"><button id="chart-type-btn" onclick="App.Charts.toggleType()" class="chart-pill bg-gray-100 text-black border-black font-bold mr-1">${App.State.chartType==='Candles'?'C':'HA'}</button><div class="w-px bg-gray-300 mx-1 h-4"></div>${['1m','5m','15m','1h','4h','1D'].map(t=>`<button class="chart-pill ${t===App.State.chartTimeframe?'active':''}" onclick="App.State.chartTimeframe='${t}';App.UI.router.go('detail','${s}')">${t}</button>`).join('')}<div class="w-px bg-gray-300 mx-1 h-4"></div><button onclick="App.Charts.zoom('in')" class="chart-pill"><i class="fa-solid fa-plus"></i></button><button onclick="App.Charts.zoom('out')" class="chart-pill"><i class="fa-solid fa-minus"></i></button><div class="w-px bg-gray-300 mx-1 h-4"></div><button onclick="App.UI.toggleLibrary(true)" class="chart-pill"><i class="fa-solid fa-layer-group"></i></button></div><div id="main-chart" class="w-full h-[300px] dt:h-[450px] border border-gray-100 rounded-xl overflow-hidden relative mb-2 mx-5 dt:mx-0"></div><div id="btm-chart-cont" class="hidden h-[120px] border border-gray-100 rounded-xl mb-6 relative mx-5 dt:mx-0 p-2"><canvas id="btm-chart"></canvas></div><div class="mt-6 mx-5 dt:mx-0 border border-gray-100 rounded-xl p-4 bg-white"><div class="flex justify-between items-center mb-4"><h3 class="font-bold text-lg flex items-center gap-2">Related News <button onclick="App.UI.showAI('news')" class="scout-btn w-6 h-6 rounded-full flex items-center justify-center text-xs"><i class="fa-solid fa-binoculars"></i></button></h3><div class="flex gap-2"><button onclick="App.UI.changeDetailNewsPage(-1)" class="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"><i class="fa-solid fa-chevron-left text-xs"></i></button><button onclick="App.UI.changeDetailNewsPage(1)" class="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"><i class="fa-solid fa-chevron-right text-xs"></i></button></div></div><div id="det-news-grid" class="grid grid-cols-1 dt:grid-cols-2 gap-3 min-h-[100px]"><div class="text-xs text-gray-400 text-center col-span-full py-4">Loading news...</div></div></div></div><div class="detail-sidebar-col mt-6 dt:mt-0"><div class="grid grid-cols-2 gap-3"><div class="bg-gray-50 p-4 rounded-xl border border-gray-100"><span class="text-xs text-gray-400 font-bold uppercase">Open</span><div class="font-bold text-gray-900 text-lg" id="det-o">--</div></div><div class="bg-gray-50 p-4 rounded-xl border border-gray-100"><span class="text-xs text-gray-400 font-bold uppercase">High</span><div class="font-bold text-gray-900 text-lg" id="det-h">--</div></div></div><div class="bg-white border border-gray-100 rounded-xl p-4 flex-1 flex flex-col min-h-[400px]"><div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-2"><h3 class="font-bold text-lg">Options Chain</h3><div class="flex gap-1"><button onclick="App.UI.setOptType('call')" id="btn-call" class="px-3 py-1 rounded bg-black text-white text-xs font-bold">Calls</button><button onclick="App.UI.setOptType('put')" id="btn-put" class="px-3 py-1 rounded text-gray-500 hover:bg-gray-100 text-xs font-bold">Puts</button></div></div><div class="overflow-x-auto no-scrollbar"><table class="w-full text-left border-collapse min-w-[350px]"><thead><tr class="text-xs text-gray-400 border-b border-gray-100"><th class="p-2 sticky left-0 bg-white z-10 shadow-sm">Strike</th><th class="p-2 text-right">Last</th><th class="p-2 text-right">Bid</th><th class="p-2 text-right">Ask</th><th class="p-2 text-right">Vol</th><th class="p-2 text-right">OI</th></tr></thead><tbody id="opt-table-body"><tr><td colspan="6" class="p-4 text-center text-xs text-gray-400">Loading Options...</td></tr></tbody></table></div></div></div></div></main>`;
                
                const [q, b, n] = await Promise.all([Network.endpoints.quote(s), Network.endpoints.bars(s, App.State.chartTimeframe), Network.endpoints.news(s, 30)]);
                
                const res = q.results?.[0];
                const price = res ? res.c : 0; const change = res ? ((res.c - res.o)/res.o)*100 : 0;
                const c = change >= 0 ? '#22c55e' : '#ef4444';
                ['det-p', 'det-p-m'].forEach(x => { const e = document.getElementById(x); if (e) e.innerText = Utils.formatCurrency(price); });
                ['det-c', 'det-c-m'].forEach(x => { const e = document.getElementById(x); if (e) { e.innerText = `${change>=0?'+':''}${change.toFixed(2)}%`; e.style.color = c; } });
                if(res) { document.getElementById('det-o').innerText = res.o; document.getElementById('det-h').innerText = res.h; }
                
                App.State.chartData = b; App.State.newsData = n;
                App.Charts.initMain('main-chart', b);
                App.UI.renderDetailNews();

                Network.endpoints.options(s).then(opts => { 
                    if(opts.error) {
                        App.State.optionsData = [];
                        Utils.toast('Options API Error (Check Tier)', 'error');
                    } else {
                        App.State.optionsData = opts; 
                    }
                    App.UI.renderOptions(price); 
                });
            },
            news: async (r) => {
                App.UI.curr = 'news';
                App.UI.app.innerHTML = `${App.UI.comps.nav()}<main class="content-area bg-[#fdfbf7] p-6 fade-in"><div class="max-w-4xl mx-auto"><div class="flex justify-between items-center mb-6"><h1 class="font-bold text-2xl text-gray-900">Market News</h1><div class="bg-white border border-gray-200 rounded-lg p-1 flex"><button onclick="App.State.newsFilter='market';App.State.newsPage=1;App.UI.views.news(true)" class="${App.State.newsFilter === 'market' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'} px-4 py-1.5 rounded-md text-xs font-bold transition">Market</button><button onclick="App.State.newsFilter='my';App.State.newsPage=1;App.UI.views.news(true)" class="${App.State.newsFilter === 'my' ? 'bg-black text-white' : 'text-gray-500 hover:bg-gray-50'} px-4 py-1.5 rounded-md text-xs font-bold transition">My Stocks</button></div></div>${App.UI.comps.searchBar()}<div id="news-grid" class="news-grid"><div class="w-full h-24 skeleton mb-3"></div></div><div id="news-pg" class="flex justify-center gap-4 mt-8"></div></div></main>`;
                if (r || App.State.newsData.length === 0) {
                    if (App.State.newsFilter === 'market') App.State.newsData = await Network.endpoints.news('market', 40);
                    else {
                        const s = [...new Set([...App.State.portfolio, ...App.State.watchlist])].slice(0, 3);
                        if (s.length === 0) { document.getElementById('news-grid').innerHTML = '<div class="col-span-full text-center text-gray-400">Add stocks first</div>'; return; }
                        const res = await Promise.all(s.map(x => Network.endpoints.news(x, 5)));
                        App.State.newsData = res.flat().sort((a, b) => new Date(b.time) - new Date(a.time));
                    }
                }
                const pg = Utils.paginate(App.State.newsData, App.State.newsPage, 12);
                const grid = document.getElementById('news-grid');
                if(grid) grid.innerHTML = pg.data.length ? pg.data.map(x => App.UI.comps.news(x)).join('') : '<div class="col-span-full text-center text-gray-400">No news found</div>';
                document.getElementById('news-pg').innerHTML = `<button onclick="App.State.newsPage--;App.UI.views.news()" ${!pg.meta.hasPrev ? 'disabled' : ''} class="w-10 h-10 border rounded bg-white"><i class="fa-solid fa-chevron-left"></i></button><span class="flex items-center text-sm font-bold text-gray-400">Pg ${pg.meta.current}</span><button onclick="App.State.newsPage++;App.UI.views.news()" ${!pg.meta.hasNext ? 'disabled' : ''} class="w-10 h-10 border rounded bg-white"><i class="fa-solid fa-chevron-right"></i></button>`;
            },
            trade: (s) => App.UI.app.innerHTML = `${App.UI.comps.nav()}<main class="content-area bg-[#fdfbf7] p-6 fade-in"><div class="max-w-md mx-auto bg-white p-6 rounded-2xl shadow border mt-10"><h1 class="font-bold text-xl mb-4">Trade ${s}</h1>${App.UI.comps.searchBar()}<button onclick="Utils.toast('Order Placed!','success')" class="w-full bg-black text-white py-3 rounded-xl font-bold">Buy ${s}</button></div></main>`,
            profile: () => App.UI.app.innerHTML = `${App.UI.comps.nav()}<main class="content-area bg-[#fdfbf7] p-6 fade-in"><div class="max-w-md"><h1 class="font-bold text-2xl mb-4">Settings</h1>${App.UI.comps.searchBar()}<label class="block text-xs font-bold text-gray-500 mb-1">Polygon API Key</label><input id="k-in" value="${Config.getApiKey()}" class="w-full border p-2 rounded mb-4"><button onclick="Config.setApiKey(document.getElementById('k-in').value, 'polygon')" class="bg-black text-white px-4 py-2 rounded font-bold text-sm mb-6">Save</button><label class="block text-xs font-bold text-gray-500 mb-1">Gemini AI API Key</label><input id="k-in-ai" value="${Config.getGeminiKey()}" class="w-full border p-2 rounded mb-4" placeholder="AI Key"><button onclick="Config.setApiKey(document.getElementById('k-in-ai').value, 'gemini')" class="bg-ai-main text-white px-4 py-2 rounded font-bold text-sm">Save AI Key</button></div></main>`
        },
        router: { go: (v, p) => App.UI.views[v] ? App.UI.views[v](p) : null },
        
        // Helper Logic
        setOptType: (t) => {
            App.State.optionsType = t;
            const a = 'bg-black text-white', i = 'text-gray-500 hover:bg-gray-100';
            document.getElementById('btn-call').className = `px-3 py-1 rounded text-xs font-bold ${t==='call'?a:i}`;
            document.getElementById('btn-put').className = `px-3 py-1 rounded text-xs font-bold ${t==='put'?a:i}`;
            const p = document.getElementById('det-p') ? parseFloat(document.getElementById('det-p').innerText.replace('$','')) : 0;
            App.UI.renderOptions(p);
        },
        renderOptions: (price) => {
            const tbody = document.getElementById('opt-table-body');
            if(!tbody) return;
            
            if(!App.State.optionsData || App.State.optionsData.length === 0) { 
                tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-xs text-gray-400">No Options Data Available</td></tr>`; 
                return; 
            }

            const today = dayjs().format('YYYY-MM-DD');
            const expiries = [...new Set(App.State.optionsData.filter(o => o.details).map(o => o.details.expiration_date))].sort();
            const nextExpiry = expiries.find(d => d >= today) || expiries[0];

            if (!nextExpiry) { 
                tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-xs text-gray-400">No Expiring Contracts Found</td></tr>`; 
                return; 
            }
            
            let filtered = App.State.optionsData.filter(o => o.details.expiration_date === nextExpiry && o.details.contract_type === App.State.optionsType);
            filtered.sort((a,b) => a.details.strike_price - b.details.strike_price);
            
            if(filtered.length === 0) {
                 filtered = App.State.optionsData.slice(0, 10);
            }
            
            let atmIndex = 0;
            if (price > 0) {
                let minDiff = Infinity;
                filtered.forEach((o, i) => { const diff = Math.abs(o.details.strike_price - price); if(diff < minDiff) { minDiff = diff; atmIndex = i; } });
            } else {
                atmIndex = Math.floor(filtered.length / 2);
            }
            
            const start = Math.max(0, atmIndex - 5);
            const end = Math.min(filtered.length, atmIndex + 5);
            const viewData = filtered.slice(start, end);
            
            tbody.innerHTML = viewData.map(o => App.UI.comps.optRow(o, price)).join('');
        },
        changeDetailNewsPage: (d) => {
            const n = App.State.detailNewsPage + d, m = Math.ceil(App.State.newsData.length / 5);
            if(n > 0 && n <= m) { App.State.detailNewsPage = n; App.UI.renderDetailNews(); }
        },
        renderDetailNews: () => {
            const g = document.getElementById('det-news-grid'); if(!g) return;
            const pg = Utils.paginate(App.State.newsData, App.State.detailNewsPage, 5);
            g.innerHTML = pg.data.length ? pg.data.map(x => App.UI.comps.news(x, true)).join('') : '<div class="col-span-full text-center text-xs text-gray-400 py-4">No news</div>';
        }
    }
};

window.App = App;