/**
 * Configuration & Environment Variables
 */
const Config = {
    // Keys are now handled on the backend (server.js .env)
    // We only keep storage keys for local user preferences
    
    storageKeys: { 
        portfolio: 'friday_pf', 
        watchlist: 'friday_wl', 
        lastAdd: 'friday_last_add' 
    },

    // No longer need getters for API keys
    getApiKey: () => null,
    getGeminiKey: () => null,
    
    // Setting keys is deprecated/removed in this version since we use the backend
    setApiKey: (k, type = 'polygon') => { 
        Utils.toast('API Keys are managed by the server administrator.', 'info');
    }
};

window.Config = Config;
