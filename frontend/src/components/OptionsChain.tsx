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
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6 h-[300px] overflow-y-auto">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Options Chain ({ticker})</h3>
            {loading ? (
                <div className="flex justify-center p-4"><div className="spinner !border-gray-300 !border-t-black"></div></div>
            ) : options.length === 0 ? (
                <p className="text-sm text-gray-500">No options data available.</p>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="text-gray-500 border-b border-gray-100">
                            <th className="pb-2">Type</th>
                            <th className="pb-2">Strike</th>
                            <th className="pb-2">Last</th>
                            <th className="pb-2">Vol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {options.map((opt, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className={`py-2 font-bold ${opt.details.contract_type === 'call' ? 'text-green-600' : 'text-red-600'}`}>
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
