import { enableMocks, forwardMediatorRequest, createMockStreamResponse } from '../_shared';

export async function GET() {
  if (enableMocks) {
    return createMockStreamResponse();
  }

  const response = await forwardMediatorRequest('/stream', { method: 'GET' });

  if (!response.body) {
    const text = await response.text().catch(() => '');
    return new Response(
      text || JSON.stringify({ ok: false, message: 'Mediator stream unavailable' }),
      {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');

  return new Response(response.body, {
    status: response.status,
    headers
  });
}
