import type { ReactNode } from 'react';

export function DiffView({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-md border border-border bg-muted/20 p-3">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">قبل</h3>
        <div className="whitespace-pre-wrap text-sm">{before}</div>
      </div>
      <div className="rounded-md border border-border bg-muted/20 p-3">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">بعد</h3>
        <div className="whitespace-pre-wrap text-sm">{after}</div>
      </div>
    </div>
  );
}
