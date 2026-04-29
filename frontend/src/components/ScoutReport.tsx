import React, { useState, useEffect } from 'react';
import { analyzeWithScout } from '../api/ai';
import type { AISettings } from '../api/ai';
import { getAISettings } from '../lib/idb';

interface ScoutReportProps {
    query: string;
}

export const ScoutReport: React.FC<ScoutReportProps> = ({ query }) => {
    const [loading, setLoading] = useState(false);
    const [reportText, setReportText] = useState<string>('');
    const [promptInput, setPromptInput] = useState<string>('');
    const [settings, setSettings] = useState<AISettings | null>(null);

    useEffect(() => {
        getAISettings().then((s) => {
            if (s) {
                setSettings(s);
            } else {
                setSettings({ provider: 'gemini' }); // default fallback
            }
        });
    }, []);

    const handleAnalyze = async (promptToUse: string) => {
        if (!promptToUse || !settings) return;
        setLoading(true);
        try {
            const analysis = await analyzeWithScout(promptToUse, settings);
            setReportText((prev) => prev ? `${prev}\n\nUser: ${promptToUse}\nScout: ${analysis}` : `User: ${promptToUse}\nScout: ${analysis}`);
        } catch (e) {
            console.error("Scout Analysis Error", e);
            setReportText((prev) => prev ? `${prev}\n\nSystem: Failed to analyze. Check settings.` : `System: Failed to analyze. Check settings.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCustomPrompt = (e: React.FormEvent) => {
        e.preventDefault();
        handleAnalyze(promptInput);
        setPromptInput('');
    };

    return (
        <div className="bg-zinc-900 rounded-xl w-full flex flex-col shadow-sm overflow-hidden border border-zinc-800 flex-1">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ai-dark text-ai-light flex items-center justify-center">
                        <i className="fa-solid fa-binoculars"></i>
                    </div>
                    <h2 className="font-black text-sm text-zinc-100 tracking-tight">Scout AI</h2>
                </div>
            </div>
            <div className="p-3 border-b border-zinc-800 flex gap-2 overflow-x-auto whitespace-nowrap bg-zinc-950">
                <button
                    onClick={() => handleAnalyze(`Analyze current ticker ${query}`)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-zinc-800 border border-zinc-700 rounded-md hover:border-ai-main text-zinc-300 transition"
                >
                    Analyze {query}
                </button>
                <button
                    onClick={() => handleAnalyze(`Check RSI divergence for ${query}`)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-zinc-800 border border-zinc-700 rounded-md hover:border-ai-main text-zinc-300 transition"
                >
                    RSI Divergence
                </button>
                <button
                    onClick={() => handleAnalyze(`What is the overall sentiment for ${query}?`)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-zinc-800 border border-zinc-700 rounded-md hover:border-ai-main text-zinc-300 transition"
                >
                    Sentiment
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-zinc-950 min-h-[200px] flex flex-col">
                <textarea
                    readOnly
                    value={reportText}
                    className="w-full flex-1 bg-transparent resize-none outline-none text-xs text-zinc-300 font-mono"
                    placeholder="Scout standing by..."
                />
                {loading && (
                    <div className="flex items-center gap-2 mt-4 text-ai-main">
                        <div className="spinner !w-4 !h-4 !border-ai-dark !border-t-ai-main"></div>
                        <span className="text-[10px] font-bold animate-pulse text-ai-main">Scouting...</span>
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                <form onSubmit={handleCustomPrompt} className="flex gap-2">
                    <input
                        type="text"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Ask Scout..."
                        className="flex-1 border border-zinc-800 bg-zinc-950 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-ai-main placeholder-zinc-500"
                    />
                    <button type="submit" disabled={loading} className="bg-ai-main text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-ai-dark transition disabled:opacity-50">
                        Send
                    </button>
                </form>
                <p className="text-[9px] text-zinc-600 font-medium text-center mt-2">Powered by {settings?.provider === 'lm-studio' ? 'LM Studio' : 'Gemini Cloud'} • Not Financial Advice</p>
            </div>
        </div>
    );
};
