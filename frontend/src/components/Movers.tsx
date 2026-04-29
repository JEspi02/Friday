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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Live Movers</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-[10px] font-bold text-green-600 block mb-2">Gainers</span>
                    {gainers.map((g, i) => (
                        <button key={i} onClick={() => onSelect(g.ticker)} className="block w-full text-left text-sm hover:bg-green-50 p-2 rounded flex justify-between items-center transition-colors">
                            <span className="font-bold">{g.ticker}</span>
                            <div className="text-right">
                                <span className="block text-xs font-medium text-gray-700">${g.price.toFixed(2)}</span>
                                <span className="text-green-600 text-[10px] font-bold">+{g.change.toFixed(2)}%</span>
                            </div>
                        </button>
                    ))}
                </div>
                <div>
                    <span className="text-[10px] font-bold text-red-600 block mb-2">Losers</span>
                    {losers.map((l, i) => (
                        <button key={i} onClick={() => onSelect(l.ticker)} className="block w-full text-left text-sm hover:bg-red-50 p-2 rounded flex justify-between items-center transition-colors">
                            <span className="font-bold">{l.ticker}</span>
                            <div className="text-right">
                                <span className="block text-xs font-medium text-gray-700">${g.price?.toFixed(2) || l.price.toFixed(2)}</span>
                                <span className="text-red-600 text-[10px] font-bold">{l.change.toFixed(2)}%</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};