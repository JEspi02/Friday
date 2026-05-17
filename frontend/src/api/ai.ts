export interface AISettings {
    provider: 'gemini' | 'lm-studio';
    geminiKey?: string;
    lmStudioUrl?: string;
    modelName?: string;
}

export const analyzeWithScout = async (prompt: string, settings: AISettings) => {
    // 1. Retrieve the token from storage
    const token = localStorage.getItem('token');

    // 2. Build the headers dynamically
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // 3. Attach the Bearer token if it exists to satisfy backend auth requirements
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: headers,
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