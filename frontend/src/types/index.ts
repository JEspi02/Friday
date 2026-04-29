export interface NewsArticle {
    title: string;
    url: string;
    source: string;
    publishedAt: string;
    tickers: { symbol: string; change: number }[];
}

export interface Bar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface Quote {
    results: {
        c: number;
        o: number;
        h: number;
        l: number;
        pc: number;
        t: number;
    }[];
}
