interface LoadingProps {
  label?: string;
}

export function Loading({ label }: LoadingProps) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="size-10 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}
