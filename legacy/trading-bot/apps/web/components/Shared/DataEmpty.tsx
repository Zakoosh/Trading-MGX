import type { ReactNode } from 'react';

interface DataEmptyProps {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export function DataEmpty({ icon, title, description, action }: DataEmptyProps) {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 p-6 text-center">
      {icon ? <div className="text-muted-foreground">{icon}</div> : null}
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
