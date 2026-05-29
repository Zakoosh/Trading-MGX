import type { ReactNode } from 'react';

import { cn } from '../../lib/utils/cn';

export interface MetricDescriptor {
  id: string;
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
}

interface MetricCardsProps {
  metrics: MetricDescriptor[];
  className?: string;
}

export function MetricCards({ metrics, className }: MetricCardsProps) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2 xl:grid-cols-4', className)}>
      {metrics.map((metric) => (
        <div key={metric.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
          {metric.helper ? <p className="mt-2 text-xs text-muted-foreground">{metric.helper}</p> : null}
        </div>
      ))}
    </div>
  );
}
