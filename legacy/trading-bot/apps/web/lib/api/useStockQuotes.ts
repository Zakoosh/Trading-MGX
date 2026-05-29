import { useMemo } from 'react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export interface DashboardQuote {
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

export interface FinanceDiagnostics {
  provider: string;
  pollIntervalMs: number;
  symbols: string[];
  timestamp: number;
  errors: string[];
}

export interface FinanceQuotesResponse {
  ok: boolean;
  provider: string;
  pollIntervalMs: number;
  symbols: string[];
  quotes: DashboardQuote[];
  diagnostics: FinanceDiagnostics;
}

export function normalizeSymbols(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);
  }
  return input
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

async function fetchQuotes(symbols: string[]): Promise<FinanceQuotesResponse> {
  const params = new URLSearchParams();
  if (symbols.length) {
    params.set('symbols', symbols.join(','));
  }
  const res = await fetch(`/api/finance/quotes?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Quote request failed with ${res.status}`);
  }
  return (await res.json()) as FinanceQuotesResponse;
}

export function useStockQuotes(symbols: string[] = []): UseQueryResult<FinanceQuotesResponse> {
  const normalized = useMemo(() => normalizeSymbols(symbols), [symbols.join(',')]);
  return useQuery({
    queryKey: ['finance', 'quotes', normalized.join(',')],
    queryFn: () => fetchQuotes(normalized),
    refetchInterval: (data) => data?.pollIntervalMs ?? 15000,
    staleTime: 5000,
    retry: (failureCount, error) => {
      if (failureCount > 3) return false;
      if (error instanceof Error && /501|Not yet implemented/.test(error.message)) {
        return false;
      }
      return true;
    }
  });
}
