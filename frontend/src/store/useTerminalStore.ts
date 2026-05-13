import { create } from 'zustand';

interface TerminalState {
    tier: 'FREE' | 'PREMIUM';
    activeTickers: string[];
    timeframe: string;
    indicators: string[];
    isDrawingTrendline: boolean;
    analysisData: Record<string, any>;
    savedDrawings: Record<string, any[]>;

    setTier: (tier: 'FREE' | 'PREMIUM') => void;
    setTicker: (index: number, symbol: string) => void;
    addTicker: (symbol: string) => void;
    removeTicker: (index: number) => void;
    setTimeframe: (timeframe: string) => void;
    toggleIndicator: (indicator: string) => void;
    setIsDrawingTrendline: (is: boolean) => void;
    setAnalysisData: (ticker: string, data: any) => void;
    setSavedDrawings: (ticker: string, drawings: any[]) => void;
    addSavedDrawing: (ticker: string, drawing: any) => void;
}

export const useTerminalStore = create<TerminalState>()((set) => ({
    tier: 'FREE',
    activeTickers: ['AAPL'],
    timeframe: '1D',
    indicators: [],
    isDrawingTrendline: false,
    analysisData: {},
    savedDrawings: {},

    setTier: (tier) => set({ tier }),

    setTicker: (index, symbol) => set((state) => {
        const newTickers = [...state.activeTickers];
        newTickers[index] = symbol;
        return { activeTickers: newTickers };
    }),

    addTicker: (symbol) => set((state) => {
        // Free tier restricts to 1 chart instance
        if (state.tier === 'FREE') {
            return { activeTickers: [symbol] };
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

    setIsDrawingTrendline: (is) => set({ isDrawingTrendline: is }),

    setAnalysisData: (ticker, data) => set((state) => ({
        analysisData: { ...state.analysisData, [ticker]: data }
    })),

    setSavedDrawings: (ticker, drawings) => set((state) => ({
        savedDrawings: { ...state.savedDrawings, [ticker]: drawings }
    })),

    addSavedDrawing: (ticker, drawing) => set((state) => {
        const current = state.savedDrawings[ticker] || [];
        return {
            savedDrawings: { ...state.savedDrawings, [ticker]: [...current, drawing] }
        };
    }),
}));
