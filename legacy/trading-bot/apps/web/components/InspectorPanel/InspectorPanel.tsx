import type { ReactNode } from 'react';

interface InspectorPanelProps {
  title: ReactNode;
  children: ReactNode;
}

export function InspectorPanel({ title, children }: InspectorPanelProps) {
  return (
    <aside className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="text-sm text-muted-foreground">{children}</div>
    </aside>
  );
}
