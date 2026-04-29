import React, { useState, useEffect } from 'react';
import type { AISettings } from '../api/ai';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: AISettings) => void;
    initialSettings: AISettings;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState<AISettings>(initialSettings);

    // Sync state if initialSettings update (e.g., loaded from DB)
    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings, isOpen]);

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6">
                    <h2 id="settings-title" className="text-xl font-black text-theme-text-primary mb-1">System Configuration</h2>
                    <p className="text-xs text-theme-text-tertiary mb-6 uppercase tracking-widest font-bold">AI Scout Interface</p>

                    <div className="space-y-6">
                        {/* Provider Selection */}
                        <div role="group" aria-label="AI Provider Selection">
                            <label className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-widest block mb-3" id="provider-label">Brain Source</label>
                            <div className="flex gap-2 p-1 bg-theme-bg-primary rounded-xl border border-theme-border-primary" aria-labelledby="provider-label">
                                <button 
                                    onClick={() => setSettings({...settings, provider: 'gemini'})}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-ai-main ${settings.provider === 'gemini' ? 'bg-theme-bg-tertiary text-blue-400 border border-theme-border-secondary' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                                    aria-pressed={settings.provider === 'gemini'}
                                >Gemini Cloud</button>
                                <button 
                                    onClick={() => setSettings({...settings, provider: 'lm-studio'})}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-ai-main ${settings.provider === 'lm-studio' ? 'bg-theme-bg-tertiary text-purple-400 border border-theme-border-secondary' : 'text-theme-text-secondary hover:bg-theme-bg-secondary'}`}
                                    aria-pressed={settings.provider === 'lm-studio'}
                                >LM Studio Local</button>
                            </div>
                        </div>

                        {/* Provider Specific Fields */}
                        {settings.provider === 'gemini' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-widest block" htmlFor="gemini-key">API Key</label>
                                <input 
                                    id="gemini-key"
                                    type="password"
                                    className="w-full bg-theme-bg-primary border border-theme-border-primary rounded-lg px-4 py-3 text-sm text-theme-text-primary focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-theme-text-tertiary"
                                    value={settings.geminiKey || ''}
                                    onChange={e => setSettings({...settings, geminiKey: e.target.value})}
                                    placeholder="paste_key_here..."
                                />
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] font-bold text-theme-text-tertiary uppercase tracking-widest block" htmlFor="lm-url">Local Server URL</label>
                                <input 
                                    id="lm-url"
                                    type="text"
                                    className="w-full bg-theme-bg-primary border border-theme-border-primary rounded-lg px-4 py-3 text-sm text-theme-text-primary focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    value={settings.lmStudioUrl || 'http://localhost:1234/v1'}
                                    onChange={e => setSettings({...settings, lmStudioUrl: e.target.value})}
                                />
                                <p className="text-[9px] text-theme-text-tertiary font-bold italic tracking-tight">Requires LM Studio Local Server active on this machine.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-theme-bg-primary border-t border-theme-border-primary flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main rounded-md transition-colors">Abort</button>
                    <button 
                        onClick={() => onSave(settings)}
                        className="px-6 py-2 bg-theme-text-primary text-theme-bg-primary text-xs font-black rounded-lg hover:bg-theme-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ai-main"
                    >Apply Config</button>
                </div>
            </div>
        </div>
    );
};