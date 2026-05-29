import type { ReactNode } from 'react';

import { cn } from '../../lib/utils/cn';

interface MessageItemProps {
  role: 'user' | 'bot' | 'tool' | 'system';
  content: ReactNode;
  timestamp?: ReactNode;
  className?: string;
}

export function MessageItem({ role, content, timestamp, className }: MessageItemProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-background/80 p-3 shadow-sm', className)}>
      <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
        <span>{role}</span>
        {timestamp ? <span>{timestamp}</span> : null}
      </div>
      <div className="mt-2 text-sm leading-relaxed">{content}</div>
    </div>
  );
}
