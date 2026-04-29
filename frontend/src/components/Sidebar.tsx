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
                <h3 className="text-xs font-black text-theme-text-tertiary uppercase tracking-widest mb-3">Portfolio</h3>
                <div className="flex flex-col gap-2">
                    {portfolio.map(sym => (
                        <button
                            key={sym}
                            onClick={() => onSelect(sym)}
                            className="text-left font-bold px-3 py-2 bg-theme-bg-secondary rounded-lg border border-theme-border-primary hover:border-theme-border-secondary transition shadow-sm text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main focus:border-transparent"
                            aria-label={`Select ${sym} from portfolio`}
                        >
                            {sym}
                        </button>
                    ))}
                    {portfolio.length === 0 && <p className="text-sm text-theme-text-tertiary">Empty</p>}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-black text-theme-text-tertiary uppercase tracking-widest mb-3">Watchlist</h3>
                <div className="mb-3">
                    <input
                        type="text"
                        value={newTicker}
                        onChange={(e) => setNewTicker(e.target.value)}
                        onKeyDown={handleAddWatchlist}
                        placeholder="Add ticker..."
                        className="w-full bg-theme-bg-secondary border border-theme-border-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-main focus:border-transparent shadow-sm text-theme-text-primary placeholder-theme-text-tertiary transition-all"
                        aria-label="Add new ticker to watchlist"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    {watchlist.map(sym => (
                        <button
                            key={sym}
                            onClick={() => onSelect(sym)}
                            className="text-left font-bold px-3 py-2 bg-theme-bg-secondary rounded-lg border border-theme-border-primary hover:border-theme-border-secondary transition shadow-sm text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main focus:border-transparent"
                            aria-label={`Select ${sym} from watchlist`}
                        >
                            {sym}
                        </button>
                    ))}
                    {watchlist.length === 0 && <p className="text-sm text-theme-text-tertiary">Empty</p>}
                </div>
            </div>
        </div>
    );
};
