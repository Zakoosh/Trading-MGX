export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  channel: string;
  message: string;
  requestId?: string;
  createdAt: string;
}

export const defaultColumns = ['level', 'channel', 'message', 'createdAt'] as const;
