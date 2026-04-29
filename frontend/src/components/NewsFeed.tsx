import React from 'react';
import type { NewsArticle } from '../types';

interface NewsFeedProps {
    articles: NewsArticle[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ articles }) => {
    if (articles.length === 0) {
        return (
            <div className="p-8 text-center bg-zinc-900 rounded-2xl border border-dashed border-zinc-800">
                <i className="fa-regular fa-newspaper text-3xl text-zinc-700 mb-3 block"></i>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No News Available</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {articles.map((article, index) => (
                <a key={index} href={article.url} target="_blank" rel="noreferrer" className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:shadow-md hover:border-zinc-700 transition-all group text-zinc-100">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md">{article.source}</span>
                        <span className="text-[10px] font-bold text-zinc-500">{new Date(article.publishedAt).toLocaleTimeString()}</span>
                    </div>
                    <h3 className="font-bold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">{article.title}</h3>
                    {article.tickers && article.tickers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {article.tickers.map((t, idx) => (
                                <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.change >= 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                    ${t.symbol} {t.change > 0 ? '+' : ''}{t.change}%
                                </span>
                            ))}
                        </div>
                    )}
                </a>
            ))}
        </div>
    );
};
