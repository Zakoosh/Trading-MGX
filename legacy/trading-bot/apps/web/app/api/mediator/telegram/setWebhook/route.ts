import { NextRequest } from 'next/server';

import { enableMocks, forwardMediatorRequest } from '../../_shared';

const mockResponse = {
  ok: true,
  result: true,
  description: 'Mock webhook set'
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  if (enableMocks) {
    return Response.json({ ...mockResponse, echo: body });
  }

  const response = await forwardMediatorRequest('/telegram/setWebhook', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(text || JSON.stringify({ ok: false }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const json = await response.json().catch(() => mockResponse);
  return Response.json(json);
}
