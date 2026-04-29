export interface AISettings {
    provider: 'gemini' | 'lm-studio';
    geminiKey?: string;
    lmStudioUrl?: string;
    modelName?: string;
}

export const analyzeWithScout = async (prompt: string, settings: AISettings) => {
    const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            provider: settings.provider,
            api_key: settings.geminiKey,
            base_url: settings.lmStudioUrl,
            model_name: settings.modelName || (settings.provider === 'gemini' ? 'gemini-1.5-flash' : 'lms-default')
        }),
    });

    if (!response.ok) throw new Error('Scout failed to respond');
    const data = await response.json();
    return data.analysis;
};