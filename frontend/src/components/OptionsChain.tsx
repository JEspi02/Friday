import React, { useEffect, useState } from 'react';
import { useMassiveData } from '../hooks/useMassiveData';

interface OptionsChainProps {
    ticker: string;
}

export const OptionsChain: React.FC<OptionsChainProps> = ({ ticker }) => {
    const { fetchOptions } = useMassiveData();
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchOptions(ticker).then(data => {
            setOptions(data);
            setLoading(false);
        });
    }, [ticker, fetchOptions]);

    return (
        <div className="bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-800 mt-6 h-[300px] overflow-y-auto text-zinc-100">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Options Chain ({ticker})</h3>
            {loading ? (
                <div className="flex justify-center p-4"><div className="spinner !border-zinc-700 !border-t-zinc-300"></div></div>
            ) : options.length === 0 ? (
                <p className="text-sm text-zinc-500">No options data available.</p>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-zinc-500 border-b border-zinc-800">
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Strike</th>
                            <th className="pb-2">Last</th>
                            <th className="pb-2">Vol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {options.map((opt, i) => (
                            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800">
                                <td className={`py-2 font-bold ${opt.details.contract_type === 'call' ? 'text-green-500' : 'text-red-500'}`}>
                                    {opt.details.contract_type.toUpperCase()}
                                </td>
                                <td className="py-2">{opt.details.strike_price}</td>
                                <td className="py-2">{opt.last_trade.price}</td>
                                <td className="py-2">{opt.day.volume}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
