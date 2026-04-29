import React, { useState } from 'react';
import { useStore } from '../store';
import { useMassiveData } from '../hooks/useMassiveData';
import { setWatchlistIDB } from '../lib/idb';

interface SidebarProps {
    onSelect: (sym: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
    const { portfolio, watchlist, setWatchlist } = useStore();
    const { saveWatchlist } = useMassiveData();
    const [newTicker, setNewTicker] = useState('');

    const handleAddWatchlist = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTicker.trim()) {
            const ticker = newTicker.trim().toUpperCase();
            if (!watchlist.includes(ticker)) {
                const updatedWatchlist = [...watchlist, ticker];
                setWatchlist(updatedWatchlist);
                setNewTicker('');

                await saveWatchlist(updatedWatchlist);
                await setWatchlistIDB(updatedWatchlist);
            } else {
                setNewTicker('');
            }
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Portfolio</h3>
                <div className="flex flex-col gap-2">
                    {portfolio.map(sym => (
                        <button
                            key={sym}
                            onClick={() => onSelect(sym)}
                            className="text-left font-bold px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition shadow-sm text-zinc-100"
                        >
                            {sym}
                        </button>
                    ))}
                    {portfolio.length === 0 && <p className="text-sm text-zinc-500">Empty</p>}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Watchlist</h3>
                <div className="mb-3">
                    <input
                        type="text"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value)}
                        onKeyDown={handleAddWatchlist}
                        placeholder="Add ticker..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-700 shadow-sm text-zinc-100 placeholder-zinc-500"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    {watchlist.map(sym => (
                        <button
                            key={sym}
                            onClick={() => onSelect(sym)}
                            className="text-left font-bold px-3 py-2 bg-zinc-900 rounded-lg border border-zinc-800 hover:border-zinc-700 transition shadow-sm text-zinc-100"
                        >
                            {sym}
                        </button>
                    ))}
                    {watchlist.length === 0 && <p className="text-sm text-zinc-500">Empty</p>}
                </div>
            </div>
        </div>
    );
};
