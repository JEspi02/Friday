import type { ISeriesPrimitive, IPrimitivePaneView, IPrimitivePaneRenderer, Time, SeriesAttachedParameter, Logical } from 'lightweight-charts';

export interface TrendlinePoint {
    time: Time;
    price: number;
}

class TrendlineRenderer implements IPrimitivePaneRenderer {
    _p1: { x: number; y: number } | null = null;
    _p2: { x: number; y: number } | null = null;

    constructor(
        private p1: TrendlinePoint | null,
        private p2: TrendlinePoint | null,
        private series: SeriesAttachedParameter<Time> | null
    ) {}

    draw(target: any) {
        if (!this.p1 || !this.p2 || !this.series) return;

        const chart = (this.series as any).chart();
        const timeScale = chart.timeScale();

        // Convert Time to Logical index
        const lp1 = timeScale.coordinateToLogical(timeScale.timeToCoordinate(this.p1.time) || 0) || timeScale.coordinateToLogical(0);
        const lp2 = timeScale.coordinateToLogical(timeScale.timeToCoordinate(this.p2.time) || 0) || timeScale.coordinateToLogical(0);

        // Convert to coordinates
        const x1 = timeScale.logicalToCoordinate(lp1 as Logical) || 0;
        const x2 = timeScale.logicalToCoordinate(lp2 as Logical) || 0;

        const y1 = (this.series as any).priceToCoordinate(this.p1.price as any) || 0;
        const y2 = (this.series as any).priceToCoordinate(this.p2.price as any) || 0;

        target.useBitmapCoordinateSpace((scope: any) => {
            const ctx = scope.context;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = '#2962FF';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }
}

class TrendlinePaneView implements IPrimitivePaneView {
    constructor(private source: TrendlinePrimitive) {}

    zOrder() { return 'normal' as const; }

    renderer() {
        return new TrendlineRenderer(
            this.source.p1,
            this.source.p2,
            this.source.series
        );
    }
}

export class TrendlinePrimitive implements ISeriesPrimitive<Time> {
    p1: TrendlinePoint | null = null;
    p2: TrendlinePoint | null = null;
    series: SeriesAttachedParameter<Time> | null = null;

    private _paneViews: TrendlinePaneView[];

    constructor(p1: TrendlinePoint | null = null, p2: TrendlinePoint | null = null) {
        this.p1 = p1;
        this.p2 = p2;
        this._paneViews = [new TrendlinePaneView(this)];
    }

    attached({ requestUpdate, series }: any) {
        this.series = series;
        this.requestUpdate = requestUpdate;
    }

    detached() {
        this.series = null;
    }

    paneViews() {
        return this._paneViews;
    }

    updateP1(p1: TrendlinePoint) {
        this.p1 = p1;
        this.requestUpdate?.();
    }

    updateP2(p2: TrendlinePoint) {
        this.p2 = p2;
        this.requestUpdate?.();
    }

    requestUpdate?: () => void;
}
