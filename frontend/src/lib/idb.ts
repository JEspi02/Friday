import { openDB } from 'idb';
import type { Bar } from '../types';
import type { AISettings } from '../api/ai';

const DB_NAME = 'friday-cache';
const STORE_NAME = 'bars';
const SETTINGS_STORE = 'settings';
const WATCHLIST_STORE = 'watchlist';

export const initDB = async () => {
    return openDB(DB_NAME, 2, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                db.createObjectStore(SETTINGS_STORE);
            }
            if (!db.objectStoreNames.contains(WATCHLIST_STORE)) {
                db.createObjectStore(WATCHLIST_STORE);
            }
        },
    });
};

export const getCachedBars = async (key: string): Promise<Bar[] | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const data = await store.get(key);
        if (data && Date.now() - data.ts < 5 * 60 * 1000) { // 5 minutes cache
            return data.val;
        }
        return null;
    } catch (e) {
        console.error("IDB get error", e);
        return null;
    }
};

export const setCachedBars = async (key: string, val: Bar[]) => {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.put({ ts: Date.now(), val }, key);
        await tx.done;
    } catch (e) {
        console.error("IDB set error", e);
    }
};

export const getAISettings = async (): Promise<AISettings | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        const store = tx.objectStore(SETTINGS_STORE);
        const data = await store.get('ai_settings');
        return data || null;
    } catch (e) {
        console.error("IDB get settings error", e);
        return null;
    }
};

export const setAISettings = async (val: AISettings) => {
    try {
        const db = await initDB();
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const store = tx.objectStore(SETTINGS_STORE);
        await store.put(val, 'ai_settings');
        await tx.done;
    } catch (e) {
        console.error("IDB set settings error", e);
    }
};

export const getWatchlistIDB = async (): Promise<string[] | null> => {
    try {
        const db = await initDB();
        const tx = db.transaction(WATCHLIST_STORE, 'readonly');
        const store = tx.objectStore(WATCHLIST_STORE);
        const data = await store.get('watchlist');
        return data || null;
    } catch (e) {
        console.error("IDB get watchlist error", e);
        return null;
    }
};

export const setWatchlistIDB = async (val: string[]) => {
    try {
        const db = await initDB();
        const tx = db.transaction(WATCHLIST_STORE, 'readwrite');
        const store = tx.objectStore(WATCHLIST_STORE);
        await store.put(val, 'watchlist');
        await tx.done;
    } catch (e) {
        console.error("IDB set watchlist error", e);
    }
};
