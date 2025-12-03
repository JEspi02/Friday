/**
 * Configuration & Environment Variables
 */
const Config = {
    defaultKey: '3GynnSpSjIYUSQ9dnYEAdXLpVV0ETpc0', 
    geminiKey: "", // User can override in settings
    
    storageKeys: { 
        apiKey: 'friday_api_key', 
        geminiKey: 'friday_gemini_key',
        portfolio: 'friday_pf', 
        watchlist: 'friday_wl', 
        lastAdd: 'friday_last_add' 
    },

    getApiKey: () => localStorage.getItem('friday_api_key') || Config.defaultKey,
    getGeminiKey: () => localStorage.getItem('friday_gemini_key') || Config.geminiKey,
    
    setApiKey: (k, type = 'polygon') => { 
        if(!k) return;
        const cleanKey = k.trim();
        if(cleanKey.length < 5) { Utils.toast('Invalid Key', 'error'); return; }
        const storeKey = type === 'gemini' ? 'friday_gemini_key' : 'friday_api_key';
        localStorage.setItem(storeKey, cleanKey); 
        Utils.toast(`${type === 'gemini' ? 'Gemini' : 'Polygon'} Key Saved!`, 'success');
        if(type !== 'gemini') setTimeout(() => location.reload(), 1000); 
    }
};

window.Config = Config;