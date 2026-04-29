import { create } from 'zustand';
import type { NewsArticle } from '../types';

interface AppState {
    portfolio: string[];
    watchlist: string[];
    activeSymbol: string;
    chartTimeframe: string;
    newsData: NewsArticle[];

    setPortfolio: (portfolio: string[]) => void;
    setWatchlist: (watchlist: string[]) => void;
    toggleWatchlist: (symbol: string) => void;
    setActiveSymbol: (symbol: string) => void;
    setChartTimeframe: (timeframe: string) => void;
    setNewsData: (news: NewsArticle[]) => void;
}

export const useStore = create<AppState>()(
    (set) => ({
        portfolio: [],
        watchlist: [],
        activeSymbol: 'AAPL',
        chartTimeframe: '1D',
        newsData: [],

        setPortfolio: (portfolio) => set({ portfolio }),
        setWatchlist: (watchlist) => set({ watchlist }),
        toggleWatchlist: (symbol) => set((state) => ({
            watchlist: state.watchlist.includes(symbol)
                ? state.watchlist.filter(t => t !== symbol)
                : [...state.watchlist, symbol]
        })),
        setActiveSymbol: (activeSymbol) => set({ activeSymbol }),
        setChartTimeframe: (chartTimeframe) => set({ chartTimeframe }),
        setNewsData: (newsData) => set({ newsData }),
    })
);
