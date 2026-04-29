import React from 'react';
import { useStore } from '../store';

interface SidebarProps {
    onSelect: (sym: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelect }) => {
    const { portfolio, watchlist } = useStore();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Portfolio</h3>
                <div className="flex flex-col gap-2">
                    {portfolio.map(sym => (
                        <button
                            key={sym}
                            onClick={() => onSelect(sym)}
                            className="text-left font-bold px-3 py-2 bg-white rounded-lg border border-gray-100 hover:border-gray-300 transition shadow-sm"
                        >
                            {sym}
                        </button>
                    ))}
                    {portfolio.length === 0 && <p className="text-sm text-gray-500">Empty</p>}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Watchlist</h3>
                <div className="flex flex-col gap-2">
                    {watchlist.map(sym => (
                        <button
                            key={sym}
                            onClick={() => onSelect(sym)}
                            className="text-left font-bold px-3 py-2 bg-white rounded-lg border border-gray-100 hover:border-gray-300 transition shadow-sm"
                        >
                            {sym}
                        </button>
                    ))}
                    {watchlist.length === 0 && <p className="text-sm text-gray-500">Empty</p>}
                </div>
            </div>
        </div>
    );
};
