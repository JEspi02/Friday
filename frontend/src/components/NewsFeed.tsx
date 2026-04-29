import React from 'react';
import type { NewsArticle } from '../types';

interface NewsFeedProps {
    articles: NewsArticle[];
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ articles }) => {
    if (articles.length === 0) {
        return (
            <div className="p-8 text-center bg-theme-bg-secondary rounded-2xl border border-dashed border-theme-border-primary" aria-live="polite">
                <i className="fa-regular fa-newspaper text-3xl text-theme-text-tertiary mb-3 block" aria-hidden="true"></i>
                <h3 className="text-sm font-bold text-theme-text-tertiary uppercase tracking-widest">No News Available</h3>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3" aria-live="polite" aria-label="News Feed">
            {articles.map((article, index) => (
                <a key={index} href={article.url} target="_blank" rel="noreferrer" className="block bg-theme-bg-secondary border border-theme-border-primary rounded-xl p-4 hover:shadow-md hover:border-theme-border-secondary transition-all group text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-ai-main focus:border-transparent" aria-label={`Read article: ${article.title}`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-secondary bg-theme-bg-tertiary px-2 py-1 rounded-md">{article.source}</span>
                        <span className="text-[10px] font-bold text-theme-text-tertiary">{new Date(article.publishedAt).toLocaleTimeString()}</span>
                    </div>
                    <h3 className="font-bold text-sm text-theme-text-primary group-hover:text-ai-main transition-colors line-clamp-2">{article.title}</h3>
                    {article.tickers && article.tickers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {article.tickers.map((t, idx) => (
                                <span key={idx} className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.change >= 0 ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-red-500/10 text-red-600 dark:text-red-500'}`}>
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
