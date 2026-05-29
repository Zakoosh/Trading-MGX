import { NextRequest } from 'next/server';

import { enableMocks } from '../../mediator/_shared';

type Provider =
  | 'mediator'
  | 'yahoo_unofficial'
  | 'alpha_vantage'
  | 'finnhub'
  | 'twelve_data';

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  currency?: string | null;
  tz?: string | null;
  source?: string | null;
  updatedAt: number;
  isStale?: boolean;
}

const MOCK_QUOTES: Quote[] = [
  { symbol: 'AAPL', price: 194.12, change: 1.25, changePct: 0.65, currency: 'USD', updatedAt: Date.now() },
  { symbol: 'MSFT', price: 409.87, change: -2.11, changePct: -0.51, currency: 'USD', updatedAt: Date.now() },
  { symbol: 'TSLA', price: 176.54, change: 3.92, changePct: 2.27, currency: 'USD', updatedAt: Date.now() }
];

function normalizeSymbols(input: string | null): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

async function fetchYahooQuotes(symbols: string[]): Promise<{ quotes: Quote[]; errors?: string[] }> {
  if (!symbols.length) {
    return { quotes: [] };
  }
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'bot-console/1.0' } });
  if (!res.ok) {
    throw new Error(`Yahoo quote request failed (${res.status})`);
  }
  const json = (await res.json()) as { quoteResponse?: { result?: Array<Record<string, unknown>> } };
  const results = json?.quoteResponse?.result ?? [];
  const quotes: Quote[] = results.map((item) => {
    const last = Number(item.regularMarketPrice ?? item.postMarketPrice ?? item.preMarketPrice ?? NaN);
    const prev = Number(item.regularMarketPreviousClose ?? last);
    const change = Number(item.regularMarketChange ?? (isFinite(last - prev) ? last - prev : 0));
    const changePct = Number(item.regularMarketChangePercent ?? ((prev ? change / prev : 0) * 100));
    const currency = typeof item.currency === 'string' ? item.currency : null;
    const tz = typeof item.exchangeTimezoneName === 'string' ? item.exchangeTimezoneName : null;
    const timestamp =
      (typeof item.regularMarketTime === 'number' ? item.regularMarketTime * 1000 : Date.now());
    const symbol = String(item.symbol ?? '').toUpperCase();
    return {
      symbol,
      price: Number.isFinite(last) ? last : 0,
      change: Number.isFinite(change) ? change : 0,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      currency,
      tz,
      source: 'yahoo',
      updatedAt: timestamp,
      isStale: Date.now() - timestamp > 1000 * 60 * 15
    };
  });
  return { quotes };
}

async function fetchMediatorQuotes(symbols: string[]): Promise<{ quotes: Quote[]; errors?: string[] }> {
  const base = (process.env.MEDIATOR_BASE_URL || '').replace(/\/+$/, '');
  if (!base) {
    return {
      quotes: [],
      errors: ['MEDIATOR_BASE_URL is not configured']
    };
  }
  const url = `${base}/finance/quotes?symbols=${encodeURIComponent(symbols.join(','))}`;
  try {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) {
      return {
        quotes: [],
        errors: [`Mediator responded with ${res.status}`]
      };
    }
    const json = (await res.json()) as { quotes?: Quote[] };
    return { quotes: json.quotes ?? [] };
  } catch (error) {
    return {
      quotes: [],
      errors: [(error as Error).message]
    };
  }
}

function buildDiagnostics(params: {
  provider: Provider;
  pollIntervalMs: number;
  symbols: string[];
  errors?: string[];
}) {
  return {
    provider: params.provider,
    pollIntervalMs: params.pollIntervalMs,
    symbols: params.symbols,
    timestamp: Date.now(),
    errors: params.errors ?? []
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = normalizeSymbols(searchParams.get('symbols')) || normalizeSymbols(process.env.DEFAULT_STOCK_SYMBOLS ?? '');
  const provider = (process.env.FINANCE_PROVIDER || 'yahoo_unofficial').toLowerCase() as Provider;
  const pollIntervalMs = Number(process.env.FINANCE_POLL_INTERVAL_MS || '15000');
  const diagnosticsBase = {
    provider,
    pollIntervalMs,
    symbols
  };

  if (enableMocks) {
    return Response.json({
      ok: true,
      provider,
      pollIntervalMs,
      symbols: symbols.length ? symbols : MOCK_QUOTES.map((q) => q.symbol),
      quotes: MOCK_QUOTES.map((quote) => ({
        ...quote,
        updatedAt: Date.now(),
        source: 'mock'
      })),
      diagnostics: buildDiagnostics({ ...diagnosticsBase, errors: [] })
    });
  }

  if (!symbols.length) {
    return Response.json(
      {
        ok: false,
        message: 'No symbols supplied',
        diagnostics: buildDiagnostics({ ...diagnosticsBase, errors: ['No symbols provided'] })
      },
      { status: 400 }
    );
  }

  try {
    switch (provider) {
      case 'yahoo_unofficial': {
        const { quotes, errors } = await fetchYahooQuotes(symbols);
        if (!quotes.length) {
          return Response.json(
            {
              ok: false,
              quotes: [],
              diagnostics: buildDiagnostics({ ...diagnosticsBase, errors: errors ?? ['No quotes returned'] })
            },
            { status: 502 }
          );
        }
        return Response.json({
          ok: true,
          provider,
          pollIntervalMs,
          symbols,
          quotes,
          diagnostics: buildDiagnostics({ ...diagnosticsBase, errors })
        });
      }
      case 'mediator': {
        const { quotes, errors } = await fetchMediatorQuotes(symbols);
        if (!quotes.length) {
          return Response.json(
            {
              ok: false,
              quotes: [],
              diagnostics: buildDiagnostics({ ...diagnosticsBase, errors: errors ?? ['Mediator returned no quotes'] })
            },
            { status: 502 }
          );
        }
        return Response.json({
          ok: true,
          provider,
          pollIntervalMs,
          symbols,
          quotes,
          diagnostics: buildDiagnostics({ ...diagnosticsBase, errors })
        });
      }
      default: {
        return Response.json(
          {
            ok: false,
            quotes: [],
            diagnostics: buildDiagnostics({
              ...diagnosticsBase,
              errors: [
                `${provider} is not yet implemented. Choose one of: mediator, yahoo_unofficial.`
              ]
            })
          },
          { status: 501 }
        );
      }
    }
  } catch (error) {
    console.error('[finance] quote error', {
      provider,
      error: (error as Error).message
    });
    return Response.json(
      {
        ok: false,
        quotes: [],
        diagnostics: buildDiagnostics({
          ...diagnosticsBase,
          errors: [(error as Error).message]
        })
      },
      { status: 500 }
    );
  }
}

export const runtime = "edge";


