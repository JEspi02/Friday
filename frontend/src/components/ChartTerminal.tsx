import React, { useState } from 'react';
import { useTerminalStore } from '../store/useTerminalStore';
import { Chart } from './Chart';
import { useMassiveData } from '../hooks/useMassiveData';
import type { Bar } from '../types';
import { OptionsChain } from './OptionsChain';

export const ChartTerminal: React.FC = () => {
    const {
        tier, activeTickers, timeframe, setTimeframe, setTier,
        setAnalysisData, isDrawingTrendline, setIsDrawingTrendline, toggleIndicator,
        setSavedDrawings
    } = useTerminalStore();
    const { fetchBars, fetchAnalysis, fetchSavedDrawings, deleteDrawings } = useMassiveData();

    // In a real app, you would fetch and store bars for *each* activeTicker.
    // For this demonstration, we'll keep it simple and just show the first.
    const [bars, setBars] = React.useState<Record<string, Bar[]>>({});
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    React.useEffect(() => {
        const loadAllBars = async () => {
            const newBars: Record<string, Bar[]> = {};
            for (const ticker of activeTickers) {
                const data = await fetchBars(ticker, timeframe);
                newBars[ticker] = data;

                const drawings = await fetchSavedDrawings(ticker);
                setSavedDrawings(ticker, drawings);

                if (tier === 'PREMIUM') {
                    const analysis = await fetchAnalysis(ticker, timeframe);
                    setAnalysisData(ticker, analysis);
                }
            }
            setBars(newBars);
        };
        loadAllBars();
    }, [activeTickers, timeframe, fetchBars, fetchAnalysis, fetchSavedDrawings, tier, setAnalysisData, setSavedDrawings]);

    const handleTimeframeChange = (tf: string) => {
        if (tier === 'FREE' && ['1m', '5m', '15m'].includes(tf)) {
            setShowUpgradeModal(true);
            return;
        }
        setTimeframe(tf);
    };

    // Determine grid columns based on number of active tickers
    const gridCols = activeTickers.length === 1 ? 'grid-cols-1' :
                     activeTickers.length <= 4 ? 'grid-cols-2' : 'grid-cols-3';

    return (
        <div className="flex flex-col h-full bg-theme-bg-primary border border-theme-border-primary rounded-xl overflow-hidden relative">

            {/* Top Bar (Header) */}
            <div className="flex items-center justify-between p-3 border-b border-theme-border-primary bg-theme-bg-secondary">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-theme-text-primary">Terminal</span>
                    <div className="flex bg-theme-bg-tertiary rounded overflow-hidden border border-theme-border-primary">
                        {['1m', '15m', '1h', '1D', '1W'].map(tf => (
                            <button
                                key={tf}
                                onClick={() => handleTimeframeChange(tf)}
                                className={`px-3 py-1 text-sm font-semibold transition-colors ${
                                    timeframe === tf
                                    ? 'bg-ai-main text-white'
                                    : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tier Badge */}
                <button
                    onClick={() => setTier(tier === 'FREE' ? 'PREMIUM' : 'FREE')}
                    className={`px-3 py-1 text-xs font-black rounded uppercase tracking-wider ${
                        tier === 'PREMIUM'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                    {tier} TIER
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-12 border-r border-theme-border-primary bg-theme-bg-secondary flex flex-col items-center py-2 gap-4">
                    <button
                        className={`text-theme-text-secondary ${isDrawingTrendline ? 'text-ai-main' : 'hover:text-ai-main'}`}
                        title="Trendline"
                        onClick={() => setIsDrawingTrendline(!isDrawingTrendline)}
                    >
                        <i className="fa-solid fa-chart-line"></i>
                    </button>
                    <button
                        className="text-theme-text-secondary hover:text-red-500"
                        title="Clear Drawings"
                        onClick={() => {
                            activeTickers.forEach(ticker => {
                                deleteDrawings(ticker);
                                setSavedDrawings(ticker, []);
                            });
                        }}
                    >
                        <i className="fa-solid fa-trash"></i>
                    </button>
                    <button
                        className={`text-theme-text-secondary ${tier === 'FREE' ? 'opacity-50 cursor-not-allowed' : 'hover:text-ai-main'}`}
                        title={tier === 'FREE' ? "Fibonacci (Premium)" : "Fibonacci"}
                        onClick={() => {
                            if (tier === 'PREMIUM') {
                                toggleIndicator('fibonacci');
                            }
                        }}
                    >
                        <i className="fa-solid fa-layer-group"></i>
                    </button>
                    <button
                        className={`text-theme-text-secondary ${tier === 'FREE' ? 'opacity-50 cursor-not-allowed' : 'hover:text-ai-main'}`}
                        title={tier === 'FREE' ? "SMA 20 (Premium)" : "SMA 20"}
                        onClick={() => {
                            if (tier === 'PREMIUM') {
                                toggleIndicator('sma20');
                            }
                        }}
                    >
                        <span className="text-[10px] font-bold">SMA</span>
                    </button>
                    <button
                        className={`text-theme-text-secondary ${tier === 'FREE' ? 'opacity-50 cursor-not-allowed' : 'hover:text-ai-main'}`}
                        title={tier === 'FREE' ? "EMA 50 (Premium)" : "EMA 50"}
                        onClick={() => {
                            if (tier === 'PREMIUM') {
                                toggleIndicator('ema50');
                            }
                        }}
                    >
                        <span className="text-[10px] font-bold">EMA</span>
                    </button>
                </div>

                {/* Main Arena (The Canvas Grid) */}
                <div className={`flex-1 grid ${gridCols} gap-px bg-theme-border-primary overflow-auto`}>
                    {activeTickers.map((ticker, i) => (
                        <div key={`${ticker}-${i}`} className="bg-theme-bg-primary h-full min-h-[300px] flex flex-col">
                            <div className="px-3 py-1 border-b border-theme-border-primary flex justify-between items-center text-sm font-bold">
                                {ticker}
                            </div>
                            <div className="flex-1">
                                <Chart data={bars[ticker] || []} ticker={ticker} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Sidebar (Collapsible) - Showing Options in Premium */}
                {tier === 'PREMIUM' && (
                    <div className="w-80 border-l border-theme-border-primary bg-theme-bg-secondary overflow-y-auto">
                        <div className="p-3 border-b border-theme-border-primary font-bold">
                            Options Chain ({activeTickers[0]})
                        </div>
                        <OptionsChain ticker={activeTickers[0]} />
                    </div>
                )}
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-theme-bg-primary p-6 rounded-xl border border-theme-border-primary max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-black mb-2 text-ai-main">Upgrade to Premium</h2>
                        <p className="text-theme-text-secondary mb-6">
                            Intraday timeframes (1m, 5m, 15m), multi-pane rendering, and live ticks are restricted to Premium accounts.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-4 py-2 rounded font-bold text-theme-text-secondary hover:bg-theme-bg-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setTier('PREMIUM'); setShowUpgradeModal(false); }}
                                className="px-4 py-2 rounded font-bold bg-ai-main text-white hover:bg-ai-hover shadow-lg shadow-ai-main/20"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
