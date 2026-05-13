import React from 'react';
import { useChart } from '../hooks/useChart';
import { useStore } from '../store';
import { useTerminalStore } from '../store/useTerminalStore';
import type { Bar } from '../types';

interface ChartProps {
    data: Bar[];
    ticker: string;
}

export const Chart: React.FC<ChartProps> = ({ data, ticker }) => {
    const { theme } = useStore();
    const { analysisData, indicators, tier } = useTerminalStore();

    const tickerAnalysis = analysisData[ticker] || { indicators: {}, fibonacci: {} };

    const chartContainerRef = useChart(
        data,
        theme,
        tier === 'PREMIUM' ? indicators : [],
        tier === 'PREMIUM' ? tickerAnalysis : { indicators: {}, fibonacci: {} }
    );

    return (
        <div className="w-full h-full min-h-[300px] bg-transparent overflow-hidden relative" aria-label="Interactive Stock Chart">
            <div ref={chartContainerRef} className="absolute inset-0" />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-theme-bg-primary/50 backdrop-blur-sm z-10">
                    <div className="spinner !border-theme-border-primary !border-t-theme-text-secondary"></div>
                </div>
            )}
        </div>
    );
};
