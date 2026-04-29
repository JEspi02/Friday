import { useCallback } from 'react';
import type { Bar, Quote } from '../types';
import { getCachedBars, setCachedBars } from '../lib/idb';

const API_BASE = '/api';

// Simple in-memory token promise to prevent race conditions during initial load
let _jwtTokenPromise: Promise<string> | null = null;

const getAuthToken = async (): Promise<string> => {
    if (_jwtTokenPromise) {
        return _jwtTokenPromise;
    }

    _jwtTokenPromise = fetch(`${API_BASE}/auth/login`, { method: 'POST' })
        .then(res => {
            if (!res.ok) throw new Error("Failed to authenticate");
            return res.json();
        })
        .then(data => data.access_token)
        .catch(e => {
            console.error(e);
            _jwtTokenPromise = null; // reset on failure
            return "";
        });

    return _jwtTokenPromise;
};

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

            // Backend now directly returns an array of ChartBar
            if (Array.isArray(data)) {
                // Ensure strictly ascending chronological data for lightweight-charts
                const mapped = data.map((b: any) => ({
                    time: b.time, // The backend field validator already ensures this is in seconds
                    open: b.open,
                    high: b.high,
                    low: b.low,
                    close: b.close,
                    volume: b.volume
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
            const token = await getAuthToken();
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/portfolio`, { headers });
            if(!res.ok) throw new Error('Failed to fetch portfolio');
            return await res.json();
        } catch(e) { console.error(e); return []; }
    }, []);

    const savePortfolio = useCallback(async (symbols: string[]) => {
        try {
            const token = await getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch(`${API_BASE}/portfolio`, {
                method: 'POST',
                headers,
                body: JSON.stringify(symbols)
            });
        } catch(e) { console.error(e); }
    }, []);

    const fetchWatchlist = useCallback(async () => {
        try {
            const token = await getAuthToken();
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE}/watchlist`, { headers });
            if(!res.ok) throw new Error('Failed to fetch watchlist');
            return await res.json();
        } catch(e) { console.error(e); return []; }
    }, []);

    const saveWatchlist = useCallback(async (symbols: string[]) => {
        try {
            const token = await getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            await fetch(`${API_BASE}/watchlist`, {
                method: 'POST',
                headers,
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
