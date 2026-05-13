import React, { useEffect, useState } from 'react';
import { useMassiveData } from '../hooks/useMassiveData';

interface OptionContract {
    details: {
        contract_type: 'call' | 'put';
        strike_price: number;
    };
    last_trade: { price: number };
    day: { volume: number };
}

interface OptionsChainProps {
    ticker: string;
}

export const OptionsChain: React.FC<OptionsChainProps> = ({ ticker }) => {
    const { fetchOptions } = useMassiveData();
    const [options, setOptions] = useState<OptionContract[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchOptions(ticker).then(data => {
            setOptions(data);
            setLoading(false);
        });
    }, [ticker, fetchOptions]);

    return (
        <div className="bg-theme-bg-secondary p-4 rounded-xl shadow-sm border border-theme-border-primary mt-6 h-[300px] overflow-y-auto text-theme-text-primary" aria-live="polite">
            <h3 className="text-xs font-black text-theme-text-tertiary uppercase tracking-widest mb-3">Options Chain ({ticker})</h3>
            {loading ? (
                <div className="flex justify-center p-4"><div className="spinner !border-theme-border-primary !border-t-theme-text-secondary"></div></div>
            ) : options.length === 0 ? (
                <p className="text-sm text-theme-text-tertiary">No options data available.</p>
            ) : (
                <table className="w-full text-left text-sm" aria-label={`Options chain for ${ticker}`}>
                    <thead>
                        <tr className="text-theme-text-tertiary border-b border-theme-border-primary">
                            <th className="pb-2" scope="col">Type</th>
                            <th className="pb-2" scope="col">Strike</th>
                            <th className="pb-2" scope="col">Last</th>
                            <th className="pb-2" scope="col">Vol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {options.map((opt, i) => (
                            <tr key={i} className="border-b border-theme-border-primary hover:bg-theme-bg-tertiary transition-colors">
                                <td className={`py-2 font-bold ${opt.details.contract_type === 'call' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
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
