// خدمة التكامل مع Twelve Data API

interface TimeSeriesData {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TechnicalIndicatorData {
  datetime: string;
  value: string;
}

class TwelveDataService {
  private apiKey: string;
  private baseUrl: string;
  private demoMode: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_TWELVE_DATA_BASE_URL || 'https://api.twelvedata.com';
    this.demoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true';
  }

  // الحصول على بيانات السعر
  async getTimeSeries(symbol: string, interval: string = '1day', outputsize: number = 30): Promise<TimeSeriesData[]> {
    if (this.demoMode || !this.apiKey) {
      return this.generateDemoTimeSeries(symbol, outputsize);
    }

    try {
      const url = `${this.baseUrl}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching time series:', error);
      return this.generateDemoTimeSeries(symbol, outputsize);
    }
  }

  // الحصول على مؤشر RSI
  async getRSI(symbol: string, period: number = 14): Promise<number> {
    if (this.demoMode || !this.apiKey) {
      return Math.random() * 100;
    }

    try {
      const url = `${this.baseUrl}/rsi?symbol=${symbol}&interval=1day&time_period=${period}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return parseFloat(data.values?.[0]?.rsi || '50');
    } catch (error) {
      console.error('Error fetching RSI:', error);
      return Math.random() * 100;
    }
  }

  // الحصول على مؤشر MACD
  async getMACD(symbol: string): Promise<{ macd: number; signal: number; histogram: number }> {
    if (this.demoMode || !this.apiKey) {
      return {
        macd: (Math.random() - 0.5) * 10,
        signal: (Math.random() - 0.5) * 10,
        histogram: (Math.random() - 0.5) * 5
      };
    }

    try {
      const url = `${this.baseUrl}/macd?symbol=${symbol}&interval=1day&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const latest = data.values?.[0] || {};
      
      return {
        macd: parseFloat(latest.macd || '0'),
        signal: parseFloat(latest.macd_signal || '0'),
        histogram: parseFloat(latest.macd_hist || '0')
      };
    } catch (error) {
      console.error('Error fetching MACD:', error);
      return {
        macd: (Math.random() - 0.5) * 10,
        signal: (Math.random() - 0.5) * 10,
        histogram: (Math.random() - 0.5) * 5
      };
    }
  }

  // الحصول على مؤشر EMA
  async getEMA(symbol: string, period: number = 20): Promise<number> {
    if (this.demoMode || !this.apiKey) {
      return 150 + Math.random() * 50;
    }

    try {
      const url = `${this.baseUrl}/ema?symbol=${symbol}&interval=1day&time_period=${period}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return parseFloat(data.values?.[0]?.ema || '150');
    } catch (error) {
      console.error('Error fetching EMA:', error);
      return 150 + Math.random() * 50;
    }
  }

  // الحصول على مؤشر ADX
  async getADX(symbol: string, period: number = 14): Promise<number> {
    if (this.demoMode || !this.apiKey) {
      return Math.random() * 100;
    }

    try {
      const url = `${this.baseUrl}/adx?symbol=${symbol}&interval=1day&time_period=${period}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return parseFloat(data.values?.[0]?.adx || '25');
    } catch (error) {
      console.error('Error fetching ADX:', error);
      return Math.random() * 100;
    }
  }

  // الحصول على السعر الحالي
  async getCurrentPrice(symbol: string): Promise<{ price: number; change: number; changePercent: number }> {
    if (this.demoMode || !this.apiKey) {
      const basePrice = 150 + Math.random() * 200;
      const change = (Math.random() - 0.5) * 10;
      return {
        price: basePrice,
        change: change,
        changePercent: (change / basePrice) * 100
      };
    }

    try {
      const url = `${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        price: parseFloat(data.close || '0'),
        change: parseFloat(data.change || '0'),
        changePercent: parseFloat(data.percent_change || '0')
      };
    } catch (error) {
      console.error('Error fetching current price:', error);
      const basePrice = 150 + Math.random() * 200;
      const change = (Math.random() - 0.5) * 10;
      return {
        price: basePrice,
        change: change,
        changePercent: (change / basePrice) * 100
      };
    }
  }

  // توليد بيانات تجريبية
  private generateDemoTimeSeries(symbol: string, outputsize: number): TimeSeriesData[] {
    const data: TimeSeriesData[] = [];
    let basePrice = 150 + Math.random() * 200;
    
    for (let i = outputsize - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.5) * 5;
      basePrice += change;
      
      const open = basePrice;
      const high = basePrice + Math.random() * 3;
      const low = basePrice - Math.random() * 3;
      const close = basePrice + (Math.random() - 0.5) * 2;
      
      data.push({
        datetime: date.toISOString().split('T')[0],
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume: Math.floor(Math.random() * 10000000).toString()
      });
    }
    
    return data;
  }

  // اختبار الاتصال
  async testConnection(): Promise<boolean> {
    if (this.demoMode) {
      console.log('Running in demo mode');
      return true;
    }

    try {
      const url = `${this.baseUrl}/time_series?symbol=AAPL&interval=1day&outputsize=1&apikey=${this.apiKey}`;
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const twelveDataService = new TwelveDataService();