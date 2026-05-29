import type { StreamEvent } from './validators';

type StreamEventHandler = (event: StreamEvent) => void;
type StreamErrorHandler = (error: Error) => void;

function parseStreamPayload(raw: string, fallbackType: string): StreamEvent | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        type: parsed.type ?? fallbackType,
        data: parsed.data ?? parsed,
        ts: parsed.ts ?? new Date().toISOString(),
        requestId: parsed.requestId
      };
    }
  } catch {
    return {
      type: fallbackType,
      data: raw,
      ts: new Date().toISOString()
    };
  }
  return null;
}

export function createMediatorStream({
  onMessage,
  onError
}: {
  onMessage: StreamEventHandler;
  onError?: StreamErrorHandler;
}) {
  const source = new EventSource('/api/mediator/stream');
  const eventNames = ['token', 'message', 'error', 'meta', 'final', 'rate_limited'];

  source.onmessage = (event) => {
    const payload = parseStreamPayload(event.data, 'message');
    if (payload) {
      onMessage(payload);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('[stream] Unhandled SSE message payload', event.data);
    }
  };

  eventNames.forEach((eventName) => {
    source.addEventListener(eventName, (event) => {
      const customEvent = event as MessageEvent<string>;
      const payload = parseStreamPayload(customEvent.data, eventName);
      if (payload) {
        onMessage(payload);
      } else if (process.env.NODE_ENV !== 'production') {
        console.warn('[stream] Failed to parse SSE event', eventName, customEvent.data);
      }
    });
  });

  source.onerror = () => {
    if (onError) {
      onError(new Error('Stream connection lost'));
    }
  };

  return () => source.close();
}
