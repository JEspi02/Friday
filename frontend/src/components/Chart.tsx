import React from 'react';
import { useChart } from '../hooks/useChart';
import type { Bar } from '../types';

interface ChartProps {
    data: Bar[];
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
    const chartContainerRef = useChart(data);

    return (
        <div className="w-full h-[300px] bg-zinc-900 rounded-xl shadow-sm border border-zinc-800 overflow-hidden relative">
            <div ref={chartContainerRef} className="absolute inset-0" />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-10">
                    <div className="spinner !border-zinc-700 !border-t-zinc-300"></div>
                </div>
            )}
        </div>
    );
};
