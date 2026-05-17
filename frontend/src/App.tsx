import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useStore } from './store';
import { useMassiveData } from './hooks/useMassiveData';
import { ChartTerminal } from './components/ChartTerminal';
import { NewsFeed } from './components/NewsFeed';
import { ScoutReport } from './components/ScoutReport';
import { Sidebar } from './components/Sidebar';
import { Movers } from './components/Movers';
import { SettingsModal } from './components/SettingsModal';
import { getAISettings, setAISettings } from './lib/idb';
import type { AISettings } from './api/ai';
import { useTerminalStore } from './store/useTerminalStore';

const App: React.FC = () => {
    const { newsData, theme, setPortfolio, setWatchlist, setTheme } = useStore();
    const { fetchPortfolio, fetchWatchlist } = useMassiveData();

    // Wire activeSymbol logic
    const activeSymbol = useTerminalStore(state => state.activeTickers[0]);
    const setActiveSymbol = (symbol: string) => useTerminalStore.getState().setTicker(0, symbol);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [aiSettings, setAiSettings] = useState<AISettings>({ provider: 'gemini' });

    // 1. Initial Load for AI Settings
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

    // 2. Main Initialization: Login + Data Fetching + Sockets
    useEffect(() => {
        const initApp = async () => {
            // --- LOGIN LOGIC ---
            try {
                // Check if we already have a token to avoid unnecessary logins
                if (!localStorage.getItem('token')) {
                    const response = await fetch('/api/auth/login', { method: 'POST' });
                    const data = await response.json();
                    localStorage.setItem('token', data.access_token);
                    console.log("✅ Token saved to localStorage");
                }
            } catch (error) {
                console.error("Login failed:", error);
            }

            // --- DATA FETCHING ---
            fetchPortfolio().then(p => { if (p && p.length) setPortfolio(p); });
            fetchWatchlist().then(w => { if (w && w.length) setWatchlist(w); });
        };

        initApp();

        // --- SOCKET SETUP ---
        const socket = io();
        socket.on('news-update', (articles) => {
            if (articles && articles.length > 0) {
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

    return (
        <div className={`min-h-screen bg-theme-bg-primary text-theme-text-primary p-4 font-sans transition-colors ${theme}`}>
            <header className="flex justify-between items-center mb-6 max-w-[1400px] mx-auto">
                <h1 className="text-2xl font-black tracking-tighter">FRIDAY<span className="text-ai-main">.</span></h1>
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={activeSymbol}
                        onChange={e => setActiveSymbol(e.target.value.toUpperCase())}
                        className="px-3 py-1 rounded border border-theme-border-primary bg-theme-bg-secondary font-bold uppercase w-24 text-center text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main focus:border-transparent transition-all"
                        aria-label="Stock Ticker Symbol"
                    />
                    <select
                        value={theme}
                        onChange={e => setTheme(e.target.value as 'light' | 'dark' | 'sepia')}
                        className="px-2 py-1 rounded border border-theme-border-primary bg-theme-bg-secondary font-bold text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main focus:border-transparent transition-all"
                    >
                        <option value="dark">Dark Mode</option>
                        <option value="light">Light Mode</option>
                        <option value="sepia">Sepia Mode</option>
                    </select>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="bg-theme-bg-secondary text-theme-text-primary border border-theme-border-primary px-3 py-1 rounded hover:bg-theme-bg-tertiary transition flex items-center justify-center"
                    >
                        <i className="fa-solid fa-gear"></i>
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-3 lg:col-span-2 flex flex-col gap-6">
                    <Sidebar onSelect={setActiveSymbol} />
                    <Movers onSelect={setActiveSymbol} />
                </div>
                <div className="col-span-12 md:col-span-5 lg:col-span-7 flex flex-col gap-6 h-[800px]">
                    <ChartTerminal />
                </div>
                <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-6 h-[800px] overflow-y-auto">
                    <ScoutReport query={activeSymbol} settings={aiSettings} />
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