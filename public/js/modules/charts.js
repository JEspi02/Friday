/**
 * Charts Module
 * Wrapper for Lightweight Charts
 */

const Charts = {
    chart: null,
    series: null,
    resizeObserver: null,

    init: (containerId) => {
        const el = document.getElementById(containerId);
        if (!el) return;

        // Cleanup existing if any
        if (Charts.chart) {
            Charts.chart.remove();
            Charts.resizeObserver?.disconnect();
        }

        el.innerHTML = '';

        Charts.chart = LightweightCharts.createChart(el, {
            layout: { background: { color: '#ffffff' }, textColor: '#333' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#f0f0f0' } },
            rightPriceScale: { borderVisible: false },
            timeScale: { borderVisible: false },
            height: 300
        });

        Charts.series = Charts.chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444'
        });

        // Responsive Resizing
        Charts.resizeObserver = new ResizeObserver(entries => {
            if (entries[0].contentRect && Charts.chart) {
                Charts.chart.applyOptions({
                    width: entries[0].contentRect.width,
                    height: entries[0].contentRect.height
                });
            }
        });
        Charts.resizeObserver.observe(el);
    },

    render: (data, type = 'Candles') => {
        if (!Charts.series) return;

        let renderData = data;
        if (type === 'Heiken') {
            renderData = Charts.calculateHeikenAshi(data);
        }

        Charts.series.setData(renderData);
        Charts.chart.timeScale().fitContent();
    },

    calculateHeikenAshi: (data) => {
        if(data.length === 0) return [];
        const haData = [];
        let prevOpen = data[0].open, prevClose = data[0].close;
        for (let i = 0; i < data.length; i++) {
            const d = data[i];
            const close = (d.open + d.high + d.low + d.close) / 4;
            const open = (prevOpen + prevClose) / 2;
            const high = Math.max(d.high, Math.max(open, close));
            const low = Math.min(d.low, Math.min(open, close));
            haData.push({ time: d.time, open, high, low, close });
            prevOpen = open; prevClose = close;
        }
        return haData;
    },

    zoom: (direction) => {
        if(!Charts.chart) return;
        const ts = Charts.chart.timeScale();
        const range = ts.getVisibleLogicalRange();
        if(!range) return;

        const span = range.to - range.from;
        const factor = 0.2; // 20% zoom

        // Calculate new range centered
        const delta = span * factor * (direction === 'in' ? 1 : -1);

        ts.setVisibleLogicalRange({
            from: range.from + delta,
            to: range.to - delta
        });
    }
};

export default Charts;
