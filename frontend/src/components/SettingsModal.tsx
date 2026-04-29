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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="p-6">
                    <h2 className="text-xl font-black text-white mb-1">System Configuration</h2>
                    <p className="text-xs text-zinc-500 mb-6 uppercase tracking-widest font-bold">AI Scout Interface</p>

                    <div className="space-y-6">
                        {/* Provider Selection */}
                        <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">Brain Source</label>
                            <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                                <button 
                                    onClick={() => setSettings({...settings, provider: 'gemini'})}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.provider === 'gemini' ? 'bg-zinc-800 text-blue-400 border border-zinc-700' : 'text-zinc-600'}`}
                                >Gemini Cloud</button>
                                <button 
                                    onClick={() => setSettings({...settings, provider: 'lm-studio'})}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${settings.provider === 'lm-studio' ? 'bg-zinc-800 text-purple-400 border border-zinc-700' : 'text-zinc-600'}`}
                                >LM Studio Local</button>
                            </div>
                        </div>

                        {/* Provider Specific Fields */}
                        {settings.provider === 'gemini' ? (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">API Key</label>
                                <input 
                                    type="password"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={settings.geminiKey || ''}
                                    onChange={e => setSettings({...settings, geminiKey: e.target.value})}
                                    placeholder="paste_key_here..."
                                />
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Local Server URL</label>
                                <input 
                                    type="text"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:ring-1 focus:ring-purple-500 outline-none"
                                    value={settings.lmStudioUrl || 'http://localhost:1234/v1'}
                                    onChange={e => setSettings({...settings, lmStudioUrl: e.target.value})}
                                />
                                <p className="text-[9px] text-zinc-600 font-bold italic tracking-tight">Requires LM Studio Local Server active on this machine.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300">Abort</button>
                    <button 
                        onClick={() => onSave(settings)}
                        className="px-6 py-2 bg-white text-black text-xs font-black rounded-lg hover:bg-zinc-200 transition-colors"
                    >Apply Config</button>
                </div>
            </div>
        </div>
    );
};