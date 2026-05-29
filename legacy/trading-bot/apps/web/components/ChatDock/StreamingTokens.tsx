import type { ReactNode } from 'react';

export function StreamingTokens({ tokens, footer }: { tokens: string[]; footer?: ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 text-xs font-mono">
      <div className="flex flex-wrap gap-1">
        {tokens.map((token, index) => (
          <span key={`${token}-${index}`} className="rounded bg-background px-1 py-0.5 shadow">
            {token}
          </span>
        ))}
      </div>
      {footer ? <div className="mt-2 text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
