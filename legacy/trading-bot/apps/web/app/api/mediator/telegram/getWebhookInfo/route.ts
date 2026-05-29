import { enableMocks, forwardMediatorRequest } from '../../_shared';

const mockInfo = {
  ok: true,
  result: {
    url: 'https://mock.local/telegram/webhook',
    has_custom_certificate: false,
    pending_update_count: 0,
    max_connections: 40,
    ip_address: '127.0.0.1',
    allowed_updates: ['message', 'callback_query'],
    last_error_date: undefined,
    last_error_message: undefined
  }
};

export async function GET() {
  if (enableMocks) {
    return Response.json(mockInfo);
  }

  const response = await forwardMediatorRequest('/telegram/getWebhookInfo', {
    method: 'GET'
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(text || JSON.stringify({ ok: false }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const json = await response.json().catch(() => mockInfo);
  return Response.json(json);
}
