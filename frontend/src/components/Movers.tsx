import React, { useEffect, useState } from 'react';

interface MoversProps {
    onSelect: (sym: string) => void;
}

export const Movers: React.FC<MoversProps> = ({ onSelect }) => {
    const [gainers, setGainers] = useState<any[]>([]);
    const [losers, setLosers] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/movers')
            .then(res => res.json())
            .then(data => {
                setGainers(data.gainers || []);
                setLosers(data.losers || []);
            }).catch(console.error);
    }, []);

    return (
        <div className="bg-theme-bg-secondary p-4 rounded-xl shadow-sm border border-theme-border-primary mt-6 text-theme-text-primary" aria-live="polite">
            <h3 className="text-xs font-black text-theme-text-tertiary uppercase tracking-widest mb-3">Live Movers</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-[10px] font-bold text-green-600 dark:text-green-500 block mb-2">Gainers</span>
                    {gainers.map((g, i) => (
                        <button key={i} onClick={() => onSelect(g.ticker)} className="block w-full text-left text-sm hover:bg-theme-bg-tertiary p-2 rounded flex justify-between items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ai-main" aria-label={`Select gainer ${g.ticker}`}>
                            <span className="font-bold">{g.ticker}</span>
                            <div className="text-right">
                                <span className="block text-xs font-medium text-theme-text-secondary">${g.price.toFixed(2)}</span>
                                <span className="text-green-600 dark:text-green-500 text-[10px] font-bold">+{g.change.toFixed(2)}%</span>
                            </div>
                        </button>
                    ))}
                </div>
                <div>
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-500 block mb-2">Losers</span>
                    {losers.map((l, i) => (
                        <button key={i} onClick={() => onSelect(l.ticker)} className="block w-full text-left text-sm hover:bg-theme-bg-tertiary p-2 rounded flex justify-between items-center transition-colors focus:outline-none focus:ring-2 focus:ring-ai-main" aria-label={`Select loser ${l.ticker}`}>
                            <span className="font-bold">{l.ticker}</span>
                            <div className="text-right">
                                <span className="block text-xs font-medium text-theme-text-secondary">${l.price.toFixed(2)}</span>
                                <span className="text-red-600 dark:text-red-500 text-[10px] font-bold">{l.change.toFixed(2)}%</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};