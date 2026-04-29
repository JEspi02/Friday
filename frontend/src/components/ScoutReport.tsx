import React, { useState } from 'react';
import { analyzeWithScout } from '../api/ai';
import type { AISettings } from '../api/ai';

interface ScoutReportProps {
    query: string;
    settings: AISettings;
}

export const ScoutReport: React.FC<ScoutReportProps> = ({ query, settings }) => {
    const [loading, setLoading] = useState(false);
    const [reportText, setReportText] = useState<string>('');
    const [promptInput, setPromptInput] = useState<string>('');

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
        <div className="bg-theme-bg-secondary rounded-xl w-full flex flex-col shadow-sm overflow-hidden border border-theme-border-primary flex-1" aria-label="Scout AI Panel">
            <div className="p-4 border-b border-theme-border-primary flex justify-between items-center bg-theme-bg-secondary">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ai-dark text-ai-light flex items-center justify-center" aria-hidden="true">
                        <i className="fa-solid fa-binoculars"></i>
                    </div>
                    <h2 className="font-black text-sm text-theme-text-primary tracking-tight">Scout AI</h2>
                </div>
            </div>
            <div className="p-3 border-b border-theme-border-primary flex gap-2 overflow-x-auto whitespace-nowrap bg-theme-bg-primary">
                <button
                    onClick={() => handleAnalyze(`Analyze current ticker ${query}`)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-theme-bg-tertiary border border-theme-border-secondary rounded-md hover:border-ai-main text-theme-text-secondary transition focus:outline-none focus:ring-2 focus:ring-ai-main"
                    aria-label={`Quick prompt: Analyze ${query}`}
                >
                    Analyze {query}
                </button>
                <button
                    onClick={() => handleAnalyze(`Check RSI divergence for ${query}`)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-theme-bg-tertiary border border-theme-border-secondary rounded-md hover:border-ai-main text-theme-text-secondary transition focus:outline-none focus:ring-2 focus:ring-ai-main"
                    aria-label={`Quick prompt: Check RSI divergence for ${query}`}
                >
                    RSI Divergence
                </button>
                <button
                    onClick={() => handleAnalyze(`What is the overall sentiment for ${query}?`)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-theme-bg-tertiary border border-theme-border-secondary rounded-md hover:border-ai-main text-theme-text-secondary transition focus:outline-none focus:ring-2 focus:ring-ai-main"
                    aria-label={`Quick prompt: Sentiment for ${query}`}
                >
                    Sentiment
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-theme-bg-primary min-h-[200px] flex flex-col" aria-live="polite">
                <textarea
                    readOnly
                    value={reportText}
                    className="w-full flex-1 bg-transparent resize-none outline-none text-xs text-theme-text-primary font-mono"
                    placeholder="Scout standing by..."
                    aria-label="Scout AI Analysis Output"
                />
                {loading && (
                    <div className="flex items-center gap-2 mt-4 text-ai-main" aria-label="Loading Scout response">
                        <div className="spinner !w-4 !h-4 !border-ai-dark !border-t-ai-main"></div>
                        <span className="text-[10px] font-bold animate-pulse text-ai-main">Scouting...</span>
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-theme-border-primary bg-theme-bg-secondary">
                <form onSubmit={handleCustomPrompt} className="flex gap-2">
                    <input
                        type="text"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Ask Scout..."
                        className="flex-1 border border-theme-border-primary bg-theme-bg-primary rounded-lg px-3 py-1.5 text-xs text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main placeholder-theme-text-tertiary"
                        aria-label="Custom prompt for Scout"
                    />
                    <button type="submit" disabled={loading} className="bg-ai-main text-white px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-ai-dark transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ai-light">
                        Send
                    </button>
                </form>
                <p className="text-[9px] text-theme-text-tertiary font-medium text-center mt-2">Powered by {settings?.provider === 'lm-studio' ? 'LM Studio' : 'Gemini Cloud'} • Not Financial Advice</p>
            </div>
        </div>
    );
};
