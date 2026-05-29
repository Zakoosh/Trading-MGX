import { describe, expect, it } from 'vitest';

import { normalizeSymbols } from '@/lib/api/useStockQuotes';

describe('normalizeSymbols', () => {
  it('handles string with whitespace', () => {
    expect(normalizeSymbols(' aapl , msft , tsla ')).toEqual(['AAPL', 'MSFT', 'TSLA']);
  });

  it('deduplicates empty entries', () => {
    expect(normalizeSymbols(', , aapl,,')).toEqual(['AAPL']);
  });

  it('supports array input', () => {
    expect(normalizeSymbols(['msft', 'tsla'])).toEqual(['MSFT', 'TSLA']);
  });

  it('returns empty array for falsy input', () => {
    expect(normalizeSymbols(undefined)).toEqual([]);
    // @ts-expect-error testing null
    expect(normalizeSymbols(null)).toEqual([]);
  });
});
