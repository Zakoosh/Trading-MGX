# Trading Bot Platform

Experimental trading platform pairing a FastAPI backend with a Next.js administrative console.

## Project Structure

- `main.py`, `app/` – FastAPI services for trade execution, watchdog APIs, and Telegram notifications (SQLite persistence).
- `apps/web` – Next.js (App Router) admin console with Arabic-first RTL design, TanStack Query, Zustand, Tailwind, Vitest, and Playwright.
- `templates/`, `static/` – Legacy Jinja dashboard assets (kept for reference while the new console matures).

## Frontend Quick Start

```bash
pnpm install
pnpm dev
```

The console boots on `http://localhost:3000` (Arabic locale by default).

### Essential Environment Flags

Copy `.env.example` to `.env` and adjust as needed:

- `MEDIATOR_BASE_URL` – Upstream BotMediator base URL (e.g. `http://localhost:8080`).
- `ENABLE_MOCKS=true` – Enables built-in mocks (SSE + REST) for local development and E2E tests.
- `NEXT_PUBLIC_SUPPORTED_LOCALES`/`NEXT_PUBLIC_DEFAULT_LOCALE` – Frontend locale configuration.
- Finance:
  - `FINANCE_PROVIDER` (`mediator`, `yahoo_unofficial`, `alpha_vantage`, `finnhub`, `twelve_data`)  
    `yahoo_unofficial` requires no key but is rate-limited; other providers expect `FINANCE_API_KEY`.
  - `DEFAULT_STOCK_SYMBOLS` – Comma-separated tickers displayed on the dashboard.
  - `FINANCE_POLL_INTERVAL_MS` – Quote refresh cadence (default 15000).
- Telegram:
  - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET` – Used by diagnostics/tools in Settings → Notifications.

When mocks are enabled the Next.js API routes generate deterministic streaming responses, so you can exercise the UI without running a mediator.

## Milestone M1 Highlights

### Chat Test Bench (`/chat`)
- Streams Server-Sent Events proxied via `/api/mediator/stream`.
- Aggregates `token` events into responses, displays latency, cost, and token counts.
- Composer supports channel selection, optional user ID, JSON variables, attachments, and trace toggle. Form state persists in local storage.
- Developer view exposes raw message payloads and event traces. Requests can be cancelled mid-stream.

### Health Dashboard (`/`)
- `HealthStatusCard` polls `/api/mediator/health`, with adaptive retry backoff (fast when degraded, slower when stable).
- Displays mediator status, version, latency, and redacted raw payload for diagnostics.

### Markets & Quotes
- `/api/finance/quotes` proxies to the configured provider, redacting secrets and falling back to mocks when offline.
- Dashboard shows live cards and ticker for `DEFAULT_STOCK_SYMBOLS`; the diagnostics panel highlights misconfiguration or provider failures.

### Telegram Diagnostics
- Settings → Notifications provides webhook status, the ability to re-register the webhook, and a one-click test message (results surface in Logs).
- Health cards flag pending queue size, last error, and recommend corrective actions on 429 rate limits.

## Testing & Tooling

```bash
pnpm lint         # ESLint (strict)
pnpm typecheck    # TypeScript --noEmit
pnpm test         # Vitest unit/integration tests
pnpm e2e          # Playwright E2E (requires `pnpm dev` in another shell)
```

Playwright uploads traces and recordings on failure when executed via CI (to be wired in subsequent milestones).

## Backend Notes

FastAPI remains unchanged by this milestone; it still powers webhook ingestion, risk checks, and Telegram notifications. You can run it separately via:

```bash
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Set `MEDIATOR_BASE_URL` to this host if you want the Next.js proxy to hit the Python backend directly.

---

Happy streaming! `ENABLE_MOCKS=true` is the fastest way to explore the new chat bench and health monitor without wiring up external services.

## Troubleshooting Cheatsheet

```bash
# Finance quotes (Y! fallback)
curl "http://localhost:3000/api/finance/quotes?symbols=AAPL,MSFT"

# Mediator passthrough (health)
curl "http://localhost:3000/api/mediator/health"

# Telegram webhook info
curl "http://localhost:3000/api/mediator/telegram/getWebhookInfo"

# Register webhook (POST JSON body with url/secretToken)
curl -X POST "http://localhost:3000/api/mediator/telegram/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/webhook/telegram","secretToken":"***","allowed_updates":["message","callback_query"]}'
```
