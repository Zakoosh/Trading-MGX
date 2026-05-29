export interface TraceEvent {
  ts: string;
  type: string;
  data: unknown;
  requestId?: string;
}

export function groupByRequest(events: TraceEvent[]) {
  return events.reduce<Record<string, TraceEvent[]>>((acc, event) => {
    const key = event.requestId ?? 'unknown';
    acc[key] = acc[key] ?? [];
    acc[key].push(event);
    return acc;
  }, {});
}
