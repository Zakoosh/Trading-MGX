import type { ReactNode } from 'react';

export function Preview({ children }: { children: ReactNode }) {
  return <div className="rounded-md border border-border bg-background p-4 text-sm shadow-inner">{children}</div>;
}
