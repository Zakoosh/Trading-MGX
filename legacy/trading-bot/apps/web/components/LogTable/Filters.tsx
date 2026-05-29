'use client';

import type { ChangeEvent } from 'react';

interface FiltersProps {
  onChange: (key: string, value: string) => void;
}

export function LogFilters({ onChange }: FiltersProps) {
  const handle = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.name, event.target.value);
  };

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <input
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Request ID"
        name="requestId"
        onChange={handle}
      />
      <input
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Channel"
        name="channel"
        onChange={handle}
      />
      <input
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Keyword"
        name="query"
        onChange={handle}
      />
      <input
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Level"
        name="level"
        onChange={handle}
      />
    </div>
  );
}
