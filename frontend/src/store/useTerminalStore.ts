import { create } from 'zustand';

interface TerminalState {
    tier: 'FREE' | 'PREMIUM';
    activeTickers: string[];
    timeframe: string;
    indicators: string[];

    setTier: (tier: 'FREE' | 'PREMIUM') => void;
    setTicker: (index: number, symbol: string) => void;
    addTicker: (symbol: string) => void;
    removeTicker: (index: number) => void;
    setTimeframe: (timeframe: string) => void;
    toggleIndicator: (indicator: string) => void;
}

export const useTerminalStore = create<TerminalState>()((set) => ({
    tier: 'FREE',
    activeTickers: ['AAPL'],
    timeframe: '1D',
    indicators: [],

    setTier: (tier) => set({ tier }),

    setTicker: (index, symbol) => set((state) => {
        const newTickers = [...state.activeTickers];
        newTickers[index] = symbol;
        return { activeTickers: newTickers };
    }),

    addTicker: (symbol) => set((state) => {
        // Free tier restricts to 1 chart instance
        if (state.tier === 'FREE') {
            console.warn("Free tier limited to 1 chart. Upgrade to Premium.");
            return state; // Do not modify state, let the UI handle the upsell
        }
        return { activeTickers: [...state.activeTickers, symbol] };
    }),

    removeTicker: (index) => set((state) => {
        const newTickers = [...state.activeTickers];
        newTickers.splice(index, 1);
        if (newTickers.length === 0) {
            newTickers.push('AAPL'); // Ensure at least one chart
        }
        return { activeTickers: newTickers };
    }),

    setTimeframe: (timeframe) => set({ timeframe }),

    toggleIndicator: (indicator) => set((state) => {
        if (state.indicators.includes(indicator)) {
            return { indicators: state.indicators.filter(i => i !== indicator) };
        }
        return { indicators: [...state.indicators, indicator] };
    }),
}));
