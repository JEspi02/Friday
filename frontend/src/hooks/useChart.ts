import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { Bar } from '../types';
import type { Theme } from '../store';

export const useChart = (data: Bar[], theme: Theme, activeIndicators: string[], analysisData: any) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    // Changed strict typing to any to prevent generic mismatch errors in v5
    const seriesRef = useRef<ISeriesApi<any> | null>(null);

    // Store references to indicator series/lines so we can update or remove them
    const indicatorSeriesRef = useRef<Record<string, ISeriesApi<any>>>({});
    const fibLinesRef = useRef<any[]>([]);

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

        const textColor = theme === 'light' ? '#4b5563' : theme === 'sepia' ? '#5c4b37' : '#a1a1aa';
        const gridColor = theme === 'light' ? '#e5e7eb' : theme === 'sepia' ? '#cbb48f' : '#27272a';

        if (!chartRef.current) {
            const chart = createChart(chartContainerRef.current, {
                layout: { background: { color: 'transparent' }, textColor: textColor },
                grid: { vertLines: { visible: false }, horzLines: { color: gridColor } },
                rightPriceScale: { borderVisible: false },
                timeScale: { borderVisible: false },
                height: 300,
                width: chartContainerRef.current.clientWidth
            });

            // Use the new v5.0 API syntax
            const series = chart.addSeries(CandlestickSeries, {
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

            // Clean up function attached to chart element
            (chartContainerRef.current as any)._cleanup = () => {
                window.removeEventListener('resize', handleResize);
                resizeObserver.disconnect();
                chart.remove();
            };
        } else {
            // If chart already exists, just update the theme options
            chartRef.current.applyOptions({
                layout: { background: { color: 'transparent' }, textColor: textColor },
                grid: { vertLines: { visible: false }, horzLines: { color: gridColor } }
            });
        }

    }, [theme]);

    useEffect(() => {
        return () => {
             if (chartContainerRef.current && (chartContainerRef.current as any)._cleanup) {
                 (chartContainerRef.current as any)._cleanup();
                 chartRef.current = null;
                 seriesRef.current = null;
             }
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            // Transform data ensuring strict Bar properties expected by lightweight-charts
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

    // Handle indicators and drawings
    useEffect(() => {
        if (!chartRef.current || !seriesRef.current) return;

        // Process SMA 20
        if (activeIndicators.includes('sma20') && analysisData?.indicators?.sma20) {
            if (!indicatorSeriesRef.current['sma20']) {
                indicatorSeriesRef.current['sma20'] = chartRef.current.addSeries(LineSeries, {
                    color: '#2962FF',
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                });
            }
            indicatorSeriesRef.current['sma20'].setData(analysisData.indicators.sma20);
        } else if (indicatorSeriesRef.current['sma20']) {
            chartRef.current.removeSeries(indicatorSeriesRef.current['sma20']);
            delete indicatorSeriesRef.current['sma20'];
        }

        // Process EMA 50
        if (activeIndicators.includes('ema50') && analysisData?.indicators?.ema50) {
            if (!indicatorSeriesRef.current['ema50']) {
                indicatorSeriesRef.current['ema50'] = chartRef.current.addSeries(LineSeries, {
                    color: '#FF6D00',
                    lineWidth: 2,
                    crosshairMarkerVisible: false,
                });
            }
            indicatorSeriesRef.current['ema50'].setData(analysisData.indicators.ema50);
        } else if (indicatorSeriesRef.current['ema50']) {
            chartRef.current.removeSeries(indicatorSeriesRef.current['ema50']);
            delete indicatorSeriesRef.current['ema50'];
        }

        // Process Fibonacci Levels
        // First, clear existing ones
        fibLinesRef.current.forEach(line => {
            if (seriesRef.current) {
                try { seriesRef.current.removePriceLine(line); } catch (e) {}
            }
        });
        fibLinesRef.current = [];

        if (activeIndicators.includes('fibonacci') && analysisData?.fibonacci) {
            Object.entries(analysisData.fibonacci).forEach(([level, price]) => {
                const line = seriesRef.current!.createPriceLine({
                    price: price as number,
                    color: '#FF7043',
                    lineWidth: 2,
                    lineStyle: 2, // Dashed line
                    axisLabelVisible: true,
                    title: `Fib ${level}`,
                });
                fibLinesRef.current.push(line);
            });
        }

    }, [activeIndicators, analysisData]);

    return chartContainerRef;
};