import React, { useState, useEffect } from 'react';
import { useMassiveData } from '../hooks/useMassiveData';

interface ScoutReportProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
}

export const ScoutReport: React.FC<ScoutReportProps> = ({ isOpen, onClose, query }) => {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const { scoutAnalysis } = useMassiveData();

    useEffect(() => {
        if (isOpen && query) {
            setLoading(true);
            setReportData(null);

            const fetchReport = async () => {
                try {
                    const res = await scoutAnalysis(query);
                    // Mocking mapping for agentic response or reading real JSON if available
                    if (res && res.result) {
                         setReportData(res.result);
                    } else {
                         setReportData({
                            summary: `Agent analysis for: ${query}`,
                            metrics: [
                                { label: "Data Source", value: "MCP" },
                                { label: "Status", value: "No active content returned" }
                            ],
                            dataPoints: []
                         });
                    }
                } catch (e) {
                    console.error("MCP Fetch Error", e);
                } finally {
                    setLoading(false);
                }
            };

            fetchReport();
        }
    }, [isOpen, query, scoutAnalysis]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex justify-center items-center bg-black/50 backdrop-blur-sm p-4 fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl w-full max-w-[600px] flex flex-col shadow-2xl overflow-hidden max-h-[85vh]">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ai-light text-ai-main flex items-center justify-center">
                            <i className="fa-solid fa-binoculars"></i>
                        </div>
                        <h2 className="font-black text-lg text-gray-900 tracking-tight">Scout Report</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-gray-50 rounded-full hover:bg-gray-100 transition flex items-center justify-center text-gray-500">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-4">
                            <div className="spinner !border-ai-light !border-t-ai-main"></div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scouting Market Data...</p>
                        </div>
                    ) : reportData ? (
                        <div className="flex flex-col gap-4 text-sm text-gray-800">
                            <h3 className="font-bold text-lg mb-2">{reportData.summary}</h3>

                            {reportData.metrics && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {reportData.metrics.map((m: any, i: number) => (
                                        <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="text-xs text-gray-500 uppercase tracking-wide">{m.label}</div>
                                            <div className="font-bold text-lg">{m.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {reportData.dataPoints && (
                                <ul className="list-disc pl-5 space-y-2">
                                    {reportData.dataPoints.map((dp: string, i: number) => (
                                        <li key={i}>{dp}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">Failed to load report.</p>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white text-center">
                    <p className="text-[10px] text-gray-400 font-medium">Powered by Massive MCP • Not Financial Advice</p>
                </div>
            </div>
        </div>
    );
};
