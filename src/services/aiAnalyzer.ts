// خدمة التحليل الذكي للأسهم
import { StockSignal, MarketData } from '@/types/trading';

// بيانات تجريبية للعرض التوضيحي
const DEMO_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' }
];

class AIAnalyzerService {
  // توليد بيانات تجريبية للمؤشرات الفنية
  private generateTechnicalIndicators() {
    return {
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      ema: 150 + Math.random() * 50,
      adx: Math.random() * 100
    };
  }

  // تحديد الإشارة بناءً على المؤشرات
  private determineSignal(indicators: { rsi: number; macd: number; ema: number; adx: number }): {
    signal: 'buy' | 'sell' | 'hold';
    strength: 'strong' | 'weak';
    notes: string;
  } {
    const { rsi, macd, adx } = indicators;
    
    // منطق التحليل
    if (rsi < 30 && macd > 0 && adx > 25) {
      return {
        signal: 'buy',
        strength: 'strong',
        notes: 'مؤشر RSI منخفض + تقاطع MACD إيجابي + قوة اتجاه عالية'
      };
    } else if (rsi > 70 && macd < 0 && adx > 25) {
      return {
        signal: 'sell',
        strength: 'strong',
        notes: 'مؤشر RSI مرتفع + تقاطع MACD سلبي + قوة اتجاه عالية'
      };
    } else if (rsi < 40 && macd > 0) {
      return {
        signal: 'buy',
        strength: 'weak',
        notes: 'إشارة شراء ضعيفة - RSI منخفض نسبياً'
      };
    } else if (rsi > 60 && macd < 0) {
      return {
        signal: 'sell',
        strength: 'weak',
        notes: 'إشارة بيع ضعيفة - RSI مرتفع نسبياً'
      };
    } else {
      return {
        signal: 'hold',
        strength: 'weak',
        notes: 'لا توجد إشارة واضحة - يُنصح بالانتظار'
      };
    }
  }

  // تحليل سهم واحد
  async analyzeStock(symbol: string): Promise<StockSignal> {
    // محاكاة تأخير API
    await new Promise(resolve => setTimeout(resolve, 500));

    const stock = DEMO_STOCKS.find(s => s.symbol === symbol) || DEMO_STOCKS[0];
    const basePrice = 150 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const indicators = this.generateTechnicalIndicators();
    const analysis = this.determineSignal(indicators);

    return {
      symbol: stock.symbol,
      name: stock.name,
      price: basePrice,
      change: change,
      changePercent: (change / basePrice) * 100,
      signal: analysis.signal,
      strength: analysis.strength,
      rsi: indicators.rsi,
      macd: indicators.macd,
      ema: indicators.ema,
      adx: indicators.adx,
      notes: analysis.notes,
      timestamp: new Date()
    };
  }

  // تحليل جميع الأسهم
  async analyzeMarket(): Promise<StockSignal[]> {
    const signals = await Promise.all(
      DEMO_STOCKS.map(stock => this.analyzeStock(stock.symbol))
    );
    return signals;
  }

  // الحصول على الإشارات القوية فقط
  async getStrongSignals(): Promise<StockSignal[]> {
    const allSignals = await this.analyzeMarket();
    return allSignals.filter(signal => signal.strength === 'strong');
  }

  // تقييم جودة الإشارة (AI Evaluator)
  evaluateSignal(signal: StockSignal): {
    score: number;
    confidence: string;
    recommendation: string;
  } {
    let score = 0;

    // تقييم RSI
    if (signal.signal === 'buy' && signal.rsi < 30) score += 25;
    if (signal.signal === 'sell' && signal.rsi > 70) score += 25;

    // تقييم MACD
    if (signal.signal === 'buy' && signal.macd > 0) score += 25;
    if (signal.signal === 'sell' && signal.macd < 0) score += 25;

    // تقييم ADX
    if (signal.adx > 25) score += 25;

    // تقييم القوة
    if (signal.strength === 'strong') score += 25;

    const confidence = score >= 75 ? 'عالية' : score >= 50 ? 'متوسطة' : 'منخفضة';
    const recommendation = score >= 75 
      ? 'يُنصح بالتنفيذ' 
      : score >= 50 
      ? 'يُنصح بالحذر' 
      : 'يُنصح بالانتظار';

    return { score, confidence, recommendation };
  }
}

export const aiAnalyzer = new AIAnalyzerService();