import { analyzeWithScout, AISettings } from './ai';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the global fetch API
global.fetch = vi.fn();

describe('analyzeWithScout', () => {
    afterEach(() => {
        vi.clearAllMocks();
        localStorage.clear(); // Clean up storage after each test
    });

    it('should successfully return analysis data', async () => {
        // 1. Mock a user being logged in by setting a fake token
        localStorage.setItem('token', 'fake-jwt-token');

        const mockResponse = { analysis: 'Market is bullish' };
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const settings: AISettings = { provider: 'gemini', geminiKey: 'test-key' };
        const result = await analyzeWithScout('Analyze AAPL', settings);

        expect(result).toBe('Market is bullish');
        
        // 2. Verify that the fetch call included our fake token in the headers!
        expect(fetch).toHaveBeenCalledWith('/api/ai/analyze', expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
                'Authorization': 'Bearer fake-jwt-token',
                'Content-Type': 'application/json'
            }),
            body: expect.stringContaining('"prompt":"Analyze AAPL"')
        }));
    });

    it('should throw an error on failed response', async () => {
        (fetch as any).mockResolvedValue({ ok: false });

        const settings: AISettings = { provider: 'lm-studio' };
        await expect(analyzeWithScout('test', settings)).rejects.toThrow('Scout failed to respond');
    });
});