import { http, HttpResponse } from 'msw';

export function createMediatorHandlers() {
  return [
    http.get('/api/mediator/health', () => HttpResponse.json({ status: 'ok', uptime: 1234 })),
    http.get('/api/mediator/config', () =>
      HttpResponse.json({
        defaults: {
          locale: 'ar',
          timezone: 'UTC'
        }
      })
    ),
    http.post('/api/mediator/sendMessage', async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json({ ok: true, echo: body }, { status: 200 });
    })
  ];
}
