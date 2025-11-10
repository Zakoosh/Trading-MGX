// خدمة جلب بيانات السوق من Twelve Data API
const TWELVE_DATA_API_KEY = 'fc704d2dac37491c990f5e85c1cabf85';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  datetime: string;
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  previous_close: string;
  change: string;
  percent_change: string;
  average_volume: string;
  is_market_open: boolean;
}

export interface TimeSeriesValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface TimeSeriesResponse {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    mic_code: string;
    type: string;
  };
  values: TimeSeriesValue[];
  status?: string;
}

export interface TechnicalIndicatorValue {
  datetime: string;
  [key: string]: string;
}

export interface TechnicalIndicatorResponse {
  meta: {
    symbol: string;
    interval: string;
    indicator_name: string;
  };
  values: TechnicalIndicatorValue[];
  status?: string;
}

class MarketDataService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = TWELVE_DATA_API_KEY;
    this.baseUrl = TWELVE_DATA_BASE_URL;
  }

  /**
   * جلب سعر سهم واحد
   */
  async getStockPrice(symbol: string): Promise<StockPrice | null> {
    try {
      const url = `${this.baseUrl}/price?symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch price for ${symbol}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        console.error(`API error for ${symbol}:`, data.message);
        return null;
      }

      // جلب بيانات إضافية للتغيير
      const quoteData = await this.getStockQuote(symbol);
      
      return {
        symbol,
        price: parseFloat(data.price),
        change: quoteData ? parseFloat(quoteData.change) : 0,
        changePercent: quoteData ? parseFloat(quoteData.percent_change) : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * جلب بيانات مفصلة لسهم واحد
   */
  async getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const url = `${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch quote for ${symbol}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        console.error(`API error for ${symbol}:`, data.message);
        return null;
      }

      return data as StockQuote;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * جلب أسعار عدة أسهم دفعة واحدة
   */
  async getBatchPrices(symbols: string[]): Promise<Map<string, StockPrice>> {
    const prices = new Map<string, StockPrice>();
    
    // Twelve Data يدعم حتى 120 طلب في الدقيقة للخطة المجانية
    // نقسم الطلبات إلى دفعات صغيرة مع تأخير
    const batchSize = 5;
    const delay = 1000; // 1 ثانية بين كل دفعة

    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(symbol => this.getStockPrice(symbol));
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result) {
          prices.set(batch[index], result);
        }
      });

      // تأخير بين الدفعات لتجنب تجاوز الحد
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return prices;
  }

  /**
   * جلب بيانات تاريخية لسهم
   */
  async getTimeSeries(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '1h' | '1day' = '1day',
    outputsize: number = 30
  ): Promise<TimeSeriesResponse | null> {
    try {
      const url = `${this.baseUrl}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch time series for ${symbol}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        console.error(`API error for ${symbol}:`, data.message);
        return null;
      }

      return data as TimeSeriesResponse;
    } catch (error) {
      console.error(`Error fetching time series for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * التحقق من حالة السوق (مفتوح/مغلق)
   */
  async isMarketOpen(symbol: string): Promise<boolean> {
    try {
      const quote = await this.getStockQuote(symbol);
      return quote?.is_market_open || false;
    } catch (error) {
      console.error(`Error checking market status for ${symbol}:`, error);
      return false;
    }
  }

  /**
   * جلب المؤشرات الفنية
   */
  async getTechnicalIndicator(
    symbol: string,
    indicator: 'rsi' | 'macd' | 'ema' | 'sma' | 'adx',
    interval: '1min' | '5min' | '15min' | '30min' | '1h' | '1day' = '1day',
    timePeriod: number = 14
  ): Promise<TechnicalIndicatorResponse | null> {
    try {
      const url = `${this.baseUrl}/${indicator}?symbol=${symbol}&interval=${interval}&time_period=${timePeriod}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch ${indicator} for ${symbol}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        console.error(`API error for ${symbol}:`, data.message);
        return null;
      }

      return data as TechnicalIndicatorResponse;
    } catch (error) {
      console.error(`Error fetching ${indicator} for ${symbol}:`, error);
      return null;
    }
  }
}

export const marketDataService = new MarketDataService();