import { NextRequest } from 'next/server';

import {
  buildSendMessagePayload,
  enableMocks,
  enqueueMockJob,
  forwardMediatorRequest,
  parseJsonRequest,
  redact,
  ExtendedSendMessageSchema
} from '../_shared';

export async function POST(request: NextRequest) {
  try {
    const payload = await parseJsonRequest(request, ExtendedSendMessageSchema);
    const normalized = buildSendMessagePayload(payload);

    if (enableMocks) {
      enqueueMockJob(normalized, normalized.clientRequestId!);
      return Response.json({
        ok: true,
        requestId: normalized.clientRequestId,
        acceptedAt: new Date().toISOString()
      });
    }

    const mediatorResponse = await forwardMediatorRequest('/sendMessage', {
      method: 'POST',
      body: JSON.stringify(normalized)
    });

    if (!mediatorResponse.ok) {
      const errorText = await mediatorResponse.text();
      return new Response(
        errorText ||
          JSON.stringify({
            ok: false,
            message: 'Mediator rejected the message request'
          }),
        {
          status: mediatorResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const mediatorJson = await mediatorResponse.json().catch(() => ({}));
    const requestId = mediatorJson.requestId || normalized.clientRequestId;

    return Response.json({
      ok: true,
      requestId,
      mediator: redact(mediatorJson)
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return Response.json(
      { ok: false, message: 'Unexpected error while sending message' },
      { status: 500 }
    );
  }
}
