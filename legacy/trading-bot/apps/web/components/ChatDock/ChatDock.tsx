import type { ReactNode } from 'react';

export function ChatDock({ header, composer, children }: { header?: ReactNode; composer?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      {header ? <div className="border-b border-border bg-muted/40 p-4">{header}</div> : null}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
      {composer ? <div className="border-t border-border bg-muted/30 p-4">{composer}</div> : null}
    </div>
  );
}
