import type { ReactNode } from 'react';

interface PromptEditorProps {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function PromptEditor({ header, footer, children }: PromptEditorProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
      {header}
      <div>{children}</div>
      {footer}
    </div>
  );
}
