import { useEffect, useRef } from 'react';
import { createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { Bar } from '../types';

export const useChart = (data: Bar[]) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight || 300
                });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#f0f0f0' } },
            rightPriceScale: { borderVisible: false },
            timeScale: { borderVisible: false },
            height: 300,
            width: chartContainerRef.current.clientWidth
        });

        const series = (chart as any).addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444'
        });

        chartRef.current = chart;
        seriesRef.current = series;

        window.addEventListener('resize', handleResize);

        // Responsive ResizeObserver
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0].contentRect && chartRef.current) {
                chartRef.current.applyOptions({
                    width: entries[0].contentRect.width,
                    height: entries[0].contentRect.height || 300
                });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            // Transform data ensuring strict Bar properties expected by lightweight-charts (whitespace/types)
            seriesRef.current.setData(data.map(d => ({
                 time: d.time as any,
                 open: d.open,
                 high: d.high,
                 low: d.low,
                 close: d.close
            })));
            chartRef.current?.timeScale().fitContent();
        }
    }, [data]);

    return chartContainerRef;
};
