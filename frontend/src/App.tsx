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
import type { Bar } from './types';

const App: React.FC = () => {
    const { activeSymbol, chartTimeframe, newsData, setActiveSymbol, setChartTimeframe, setPortfolio, setWatchlist } = useStore();
    const { fetchBars, fetchPortfolio, fetchWatchlist } = useMassiveData();
    const [bars, setBars] = useState<Bar[]>([]);
    const [scoutOpen, setScoutOpen] = useState(false);

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
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 font-sans">
            <header className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
                <h1 className="text-2xl font-black tracking-tighter">FRIDAY<span className="text-ai-main">.</span></h1>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={activeSymbol}
                        onChange={e => setActiveSymbol(e.target.value.toUpperCase())}
                        className="px-3 py-1 rounded border border-gray-200 font-bold uppercase w-24 text-center"
                    />
                    <select
                        value={chartTimeframe}
                        onChange={e => setChartTimeframe(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-200 font-bold"
                    >
                        <option value="1m">1m</option>
                        <option value="5m">5m</option>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="4h">4h</option>
                        <option value="1D">1D</option>
                    </select>
                    <button
                        onClick={() => setScoutOpen(true)}
                        className="bg-ai-main text-white px-4 py-1 rounded font-bold hover:bg-ai-dark transition flex items-center gap-2"
                    >
                        <i className="fa-solid fa-binoculars"></i> Scout
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 border-r border-gray-100 pr-4">
                    <Sidebar onSelect={setActiveSymbol} />
                    <Movers onSelect={setActiveSymbol} />
                </div>
                <div className="md:col-span-2 flex flex-col gap-6">
                    <Chart data={bars} />
                    <OptionsChain ticker={activeSymbol} />
                </div>
                <div className="md:col-span-1 h-[600px] overflow-y-auto">
                    <NewsFeed articles={newsData} />
                </div>
            </main>

            <ScoutReport
                isOpen={scoutOpen}
                onClose={() => setScoutOpen(false)}
                query={activeSymbol}
            />
        </div>
    );
};

export default App;
