import { openDB } from 'idb';
import type { Bar } from '../types';

const DB_NAME = 'friday-cache';
const STORE_NAME = 'bars';

export const initDB = async () => {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
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
