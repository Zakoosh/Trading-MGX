import type { ComponentProps } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { DataEmpty } from '../Shared/DataEmpty';
import type { LogEntry } from './ColumnDefs';

interface LogTableProps extends ComponentProps<typeof Virtuoso> {
  records: LogEntry[];
}

export function LogTable({ records, ...props }: LogTableProps) {
  if (!records.length) {
    return <DataEmpty title="لا توجد سجلات" description="سيتم عرض السجلات هنا عند توفرها" />;
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Virtuoso
        {...props}
        data={records}
        className="h-[480px]"
        itemContent={(index, item) => (
          <div
            key={item.id}
            className="flex flex-col gap-1 border-b border-border px-4 py-3 text-sm last:border-b-0"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">[{item.level.upper()}] {item.channel}</span>
              <span className="text-xs text-muted-foreground">{item.createdAt}</span>
            </div>
            <p className="text-muted-foreground">{item.message}</p>
            {item.requestId ? (
              <p className="text-xs text-muted-foreground">RID: {item.requestId}</p>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}
