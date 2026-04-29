import { useCallback } from 'react';
import type { Bar, Quote } from '../types';
import { getCachedBars, setCachedBars } from '../lib/idb';

const API_BASE = '/api';
const DEFAULT_USER_ID = 'default_user';

export const useMassiveData = () => {
    const fetchQuote = useCallback(async (ticker: string): Promise<Quote | null> => {
        try {
            const res = await fetch(`${API_BASE}/quote/${ticker}`);
            if (!res.ok) throw new Error('Failed to fetch quote');
            return await res.json();
        } catch (e) {
            console.error(e);
            return null;
        }
    }, []);

    const fetchBars = useCallback(async (ticker: string, timeframe: string): Promise<Bar[]> => {
        const cacheKey = `bars_${ticker}_${timeframe}`;
        const cached = await getCachedBars(cacheKey);
        if (cached) return cached;

        try {
            const res = await fetch(`${API_BASE}/chart/${ticker}?interval=${timeframe}`);
            if (!res.ok) throw new Error('Failed to fetch bars');
            const data = await res.json();
            if (data.results) {
                // Ensure strictly ascending chronological data for lightweight-charts
                const mapped = data.results.map((b: any) => ({
                    time: b.t / 1000,
                    open: b.o,
                    high: b.h,
                    low: b.l,
                    close: b.c
                })).sort((a: any, b: any) => a.time - b.time);
                await setCachedBars(cacheKey, mapped);
                return mapped;
            }
            return [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }, []);

    const fetchOptions = useCallback(async (ticker: string) => {
        try {
            const res = await fetch(`${API_BASE}/options/${ticker}`);
            if (!res.ok) throw new Error('Failed to fetch options');
            const data = await res.json();
            return data.results || [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }, []);

    const scoutAnalysis = useCallback(async (query: string) => {
        try {
            const res = await fetch(`${API_BASE}/ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: query })
            });
            if (!res.ok) throw new Error('Failed to fetch scout report');
            return await res.json();
        } catch(e) {
            console.error(e);
            return null;
        }
    }, []);

    const fetchPortfolio = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/portfolio/${DEFAULT_USER_ID}`);
            if(!res.ok) throw new Error('Failed to fetch portfolio');
            return await res.json();
        } catch(e) { console.error(e); return []; }
    }, []);

    const savePortfolio = useCallback(async (symbols: string[]) => {
        try {
            await fetch(`${API_BASE}/portfolio/${DEFAULT_USER_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(symbols)
            });
        } catch(e) { console.error(e); }
    }, []);

    const fetchWatchlist = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/watchlist/${DEFAULT_USER_ID}`);
            if(!res.ok) throw new Error('Failed to fetch watchlist');
            return await res.json();
        } catch(e) { console.error(e); return []; }
    }, []);

    const saveWatchlist = useCallback(async (symbols: string[]) => {
        try {
            await fetch(`${API_BASE}/watchlist/${DEFAULT_USER_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(symbols)
            });
        } catch(e) { console.error(e); }
    }, []);

    return {
        fetchQuote,
        fetchBars,
        fetchOptions,
        scoutAnalysis,
        fetchPortfolio,
        savePortfolio,
        fetchWatchlist,
        saveWatchlist
    };
};
