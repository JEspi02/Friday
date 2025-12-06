/**
 * Main Application Entry Point
 * Initializes Modules and Routing
 */

import State from './modules/state.js';
import Network from './modules/network.js';
import UI from './modules/ui.js';

const Router = {
    go: (view, param) => {
        UI.currentView = view;
        window.scrollTo(0, 0);

        if (view === 'home') {
            UI.renderHome();
        } else if (view === 'detail') {
            UI.renderDetail(param);
        } else if (view === 'news') {
            UI.renderNews();
        }
    },

    // Legacy support for direct calls if needed (though UI handles events now)
    toggleWatchlist: (ticker) => State.toggleWatchlist(ticker)
};

// Main Init
window.onload = () => {
    // 1. Initialize State
    State.init();

    // 2. Initialize UI (and pass Router for event delegation)
    UI.init(Router);

    // 3. Initialize Socket.io for Realtime News
    try {
        const socket = io();
        socket.on('news-update', (articles) => {
            UI.toast(`⚡ ${articles.length} New Headlines`, 'ai');
            const newData = State.setNews(articles);

            // Re-render if valid
            if (UI.currentView === 'news') UI.renderNews();
            if (UI.currentView === 'detail') UI.renderDetail(State.activeSymbol); // Refresh related news
        });
    } catch(e) {
        console.warn('Socket.io failed to connect');
    }

    // 4. Initial Route
    Router.go('home');

    // Remove Preloader
    setTimeout(() => {
        const p = document.getElementById('preloader');
        if(p) { p.style.opacity = '0'; setTimeout(() => p.remove(), 500); }
    }, 500);
};
