import React from 'react';
import { useChart } from '../hooks/useChart';
import type { Bar } from '../types';

interface ChartProps {
    data: Bar[];
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
    const chartContainerRef = useChart(data);

    return (
        <div className="w-full h-[300px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div ref={chartContainerRef} className="absolute inset-0" />
            {data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 backdrop-blur-sm z-10">
                    <div className="spinner !border-gray-300 !border-t-black"></div>
                </div>
            )}
        </div>
    );
};
