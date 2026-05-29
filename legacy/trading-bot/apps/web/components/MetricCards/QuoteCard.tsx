import type { DashboardQuote } from '@/lib/api/useStockQuotes';
import { cn } from '@/lib/utils/cn';

interface QuoteCardProps {
  quote: DashboardQuote;
}

function formatNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}

export function QuoteCard({ quote }: QuoteCardProps) {
  const up = quote.changePct >= 0;
  const badgeClass = up ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/30' : 'text-rose-300 bg-rose-500/10 border border-rose-500/30';
  const caret = up ? '▲' : '▼';
  const staleLabel = quote.isStale ? 'text-amber-300' : 'text-muted-foreground';

  return (
    <article className="rounded-lg border border-border bg-card/80 p-4 shadow-sm transition hover:-translate-y-px hover:shadow-lg">
      <header className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold tracking-wide text-foreground">{quote.symbol}</h3>
          <span className={cn('text-xs', staleLabel)}>
            {quote.currency ? `${quote.currency} • ` : ''}{new Date(quote.updatedAt).toLocaleTimeString()}
          </span>
        </div>
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold', badgeClass)}>
          {caret} {formatNumber(quote.changePct)}%
        </span>
      </header>

      <section className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold text-foreground">{formatNumber(quote.price)}</p>
          <p className="text-xs text-muted-foreground">
            {caret} {formatNumber(quote.change)}
          </p>
        </div>
        <div className="flex flex-col items-end text-[11px] text-muted-foreground">
          <span>{quote.source?.toUpperCase() ?? 'LIVE'}</span>
          {quote.isStale ? <span className="text-amber-300">سعر السوق متأخر</span> : null}
        </div>
      </section>
    </article>
  );
}
