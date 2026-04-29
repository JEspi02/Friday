import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useStore } from './store';
import { useMassiveData } from './hooks/useMassiveData';
import { Chart } from './components/Chart';
import { NewsFeed } from './components/NewsFeed';
import { ScoutReport } from './components/ScoutReport';
import { Sidebar } from './components/Sidebar';
import { Movers } from './components/Movers';
import { OptionsChain } from './components/OptionsChain';
import { SettingsModal } from './components/SettingsModal';
import { getAISettings, setAISettings } from './lib/idb';
import type { AISettings } from './api/ai';
import type { Bar } from './types';

const App: React.FC = () => {
    const { activeSymbol, chartTimeframe, newsData, setActiveSymbol, setChartTimeframe, setPortfolio, setWatchlist } = useStore();
    const { fetchBars, fetchPortfolio, fetchWatchlist } = useMassiveData();
    const [bars, setBars] = useState<Bar[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [aiSettings, setAiSettings] = useState<AISettings>({ provider: 'gemini' });

    useEffect(() => {
        getAISettings().then(s => {
            if (s) setAiSettings(s);
        });
    }, []);

    const handleSaveSettings = async (settings: AISettings) => {
        setAiSettings(settings);
        await setAISettings(settings);
        setSettingsOpen(false);
    };

    useEffect(() => {
        // Init remote data
        fetchPortfolio().then(p => { if (p && p.length) setPortfolio(p); });
        fetchWatchlist().then(w => { if (w && w.length) setWatchlist(w); });

        // Setup Socket.io connection for realtime news
        // Note: Using relative path assumes standard deployment proxy or same origin
        const socket = io();

        socket.on('news-update', (articles) => {
            if (articles && articles.length > 0) {
                // Prepend new articles using functional state update equivalent
                useStore.setState((state) => {
                    const combined = [...articles, ...state.newsData];
                    const unique = Array.from(new Map(combined.map(item => [item.url, item])).values());
                    return { newsData: unique.slice(0, 100) };
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [fetchPortfolio, fetchWatchlist, setPortfolio, setWatchlist]);

    useEffect(() => {
        const loadBars = async () => {
            const data = await fetchBars(activeSymbol, chartTimeframe);
            setBars(data);
        };
        loadBars();
    }, [activeSymbol, chartTimeframe, fetchBars]);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 font-sans">
            <header className="flex justify-between items-center mb-6 max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-black tracking-tighter">FRIDAY<span className="text-ai-main">.</span></h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={activeSymbol}
                        onChange={e => setActiveSymbol(e.target.value.toUpperCase())}
                        className="px-3 py-1 rounded border border-zinc-800 bg-zinc-900 font-bold uppercase w-24 text-center text-zinc-100 focus:outline-none focus:border-zinc-700"
                    />
                    <select
                        value={chartTimeframe}
                        onChange={e => setChartTimeframe(e.target.value)}
                        className="px-2 py-1 rounded border border-zinc-800 bg-zinc-900 font-bold text-zinc-100 focus:outline-none focus:border-zinc-700"
                    >
                        <option value="1m">1m</option>
                        <option value="5m">5m</option>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="4h">4h</option>
                        <option value="1D">1D</option>
                    </select>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded hover:bg-zinc-700 transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-gear"></i>
                    </button>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-3 lg:col-span-2 flex flex-col gap-6">
                    <Sidebar onSelect={setActiveSymbol} />
                    <Movers onSelect={setActiveSymbol} />
                </div>
                <div className="col-span-12 md:col-span-5 lg:col-span-7 flex flex-col gap-6">
                    <Chart data={bars} />
                    <OptionsChain ticker={activeSymbol} />
                </div>
                <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-6 h-[800px] overflow-y-auto">
                    <ScoutReport query={activeSymbol} />
                    <NewsFeed articles={newsData} />
                </div>
            </main>

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onSave={handleSaveSettings}
                initialSettings={aiSettings}
            />
        </div>
    );
};

export default App;
