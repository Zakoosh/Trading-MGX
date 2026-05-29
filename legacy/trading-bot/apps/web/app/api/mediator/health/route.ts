import { enableMocks, forwardMediatorRequest, redact } from '../_shared';

interface MediatorHealthPayload {
  status?: string;
  version?: string;
  latencyMs?: number;
  latency?: number;
  [key: string]: unknown;
}

function coerceStatus(status?: string): 'ok' | 'degraded' | 'down' {
  if (!status) return 'degraded';
  const normalized = status.toLowerCase();
  if (normalized.startsWith('ok') || normalized === 'healthy') return 'ok';
  if (normalized === 'down' || normalized === 'offline') return 'down';
  return 'degraded';
}

export async function GET() {
  if (enableMocks) {
    return Response.json({
      ok: true,
      status: 'ok',
      version: 'mock-1.0.0',
      latencyMs: 24,
      timestamp: new Date().toISOString()
    });
  }

  const response = await forwardMediatorRequest('/health', { method: 'GET' });

  if (!response.ok) {
    const text = await response.text();
    return new Response(text || JSON.stringify({ ok: false, message: 'Mediator health check failed' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const json = (await response.json().catch(() => null)) as MediatorHealthPayload | null;

  if (!json) {
    return new Response(
      JSON.stringify({ ok: false, message: 'Mediator health payload malformed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const status = coerceStatus(String(json.status ?? ''));
  const latencyMs = typeof json.latencyMs === 'number' ? json.latencyMs : Number(json.latency) || 0;

  return Response.json({
    ok: true,
    status,
    version: json.version ?? null,
    latencyMs,
    raw: redact(json)
  });
}
