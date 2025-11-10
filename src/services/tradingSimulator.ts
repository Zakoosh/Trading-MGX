// خدمة محاكاة التداول
import { TradeSimulation, StockSignal, DailyPerformance } from '@/types/trading';

class TradingSimulatorService {
  private trades: TradeSimulation[] = [];
  private initialCapital = 100000; // رأس المال الافتراضي

  // فتح صفقة جديدة
  openTrade(signal: StockSignal, quantity: number = 100): TradeSimulation {
    const trade: TradeSimulation = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: signal.symbol,
      entryPrice: signal.price,
      currentPrice: signal.price,
      quantity: quantity,
      profitLoss: 0,
      profitLossPercent: 0,
      status: 'open',
      entryDate: new Date(),
      signal: signal.signal
    };

    this.trades.push(trade);
    return trade;
  }

  // تحديث صفقة مفتوحة
  updateTrade(tradeId: string, currentPrice: number): TradeSimulation | null {
    const trade = this.trades.find(t => t.id === tradeId);
    if (!trade || trade.status === 'closed') return null;

    trade.currentPrice = currentPrice;
    
    // حساب الربح/الخسارة
    if (trade.signal === 'buy') {
      trade.profitLoss = (currentPrice - trade.entryPrice) * trade.quantity;
    } else {
      trade.profitLoss = (trade.entryPrice - currentPrice) * trade.quantity;
    }
    
    trade.profitLossPercent = (trade.profitLoss / (trade.entryPrice * trade.quantity)) * 100;

    return trade;
  }

  // إغلاق صفقة
  closeTrade(tradeId: string, exitPrice: number): TradeSimulation | null {
    const trade = this.trades.find(t => t.id === tradeId);
    if (!trade || trade.status === 'closed') return null;

    this.updateTrade(tradeId, exitPrice);
    trade.status = 'closed';
    trade.exitDate = new Date();

    return trade;
  }

  // الحصول على جميع الصفقات المفتوحة
  getOpenTrades(): TradeSimulation[] {
    return this.trades.filter(t => t.status === 'open');
  }

  // الحصول على جميع الصفقات المغلقة
  getClosedTrades(): TradeSimulation[] {
    return this.trades.filter(t => t.status === 'closed');
  }

  // محاكاة يوم تداول كامل
  async simulateDailyTrading(signals: StockSignal[]): Promise<TradeSimulation[]> {
    const dailyTrades: TradeSimulation[] = [];

    for (const signal of signals) {
      if (signal.strength === 'strong' && signal.signal !== 'hold') {
        // فتح صفقة
        const trade = this.openTrade(signal, 100);
        
        // محاكاة تغير السعر
        const priceChange = (Math.random() - 0.4) * signal.price * 0.05;
        const exitPrice = signal.price + priceChange;
        
        // تحديث وإغلاق الصفقة
        this.updateTrade(trade.id, exitPrice);
        this.closeTrade(trade.id, exitPrice);
        
        dailyTrades.push(trade);
      }
    }

    return dailyTrades;
  }

  // حساب الأداء اليومي
  calculateDailyPerformance(trades: TradeSimulation[]): DailyPerformance {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const winningTrades = closedTrades.filter(t => t.profitLoss > 0);
    const losingTrades = closedTrades.filter(t => t.profitLoss < 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));
    const netProfit = totalProfit - totalLoss;
    const winRate = closedTrades.length > 0 
      ? (winningTrades.length / closedTrades.length) * 100 
      : 0;

    return {
      date: new Date(),
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      totalLoss,
      netProfit,
      winRate,
      strongSignals: [],
      weakSignals: []
    };
  }

  // توليد بيانات تجريبية للعرض
  generateDemoTrades(): TradeSimulation[] {
    const demoTrades: TradeSimulation[] = [
      {
        id: 'demo_1',
        symbol: 'AAPL',
        entryPrice: 178.50,
        currentPrice: 182.30,
        quantity: 100,
        profitLoss: 380,
        profitLossPercent: 2.13,
        status: 'closed',
        entryDate: new Date(Date.now() - 86400000),
        exitDate: new Date(),
        signal: 'buy'
      },
      {
        id: 'demo_2',
        symbol: 'MSFT',
        entryPrice: 385.20,
        currentPrice: 388.90,
        quantity: 50,
        profitLoss: 185,
        profitLossPercent: 0.96,
        status: 'open',
        entryDate: new Date(Date.now() - 43200000),
        signal: 'buy'
      },
      {
        id: 'demo_3',
        symbol: 'NVDA',
        entryPrice: 495.80,
        currentPrice: 492.10,
        quantity: 75,
        profitLoss: -277.5,
        profitLossPercent: -0.75,
        status: 'open',
        entryDate: new Date(Date.now() - 21600000),
        signal: 'buy'
      }
    ];

    this.trades = demoTrades;
    return demoTrades;
  }

  // الحصول على إحصائيات المحفظة
  getPortfolioStats() {
    const openTrades = this.getOpenTrades();
    const closedTrades = this.getClosedTrades();
    
    const totalInvested = openTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
    const currentValue = openTrades.reduce((sum, t) => sum + (t.currentPrice * t.quantity), 0);
    const unrealizedPL = openTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const realizedPL = closedTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalPL = unrealizedPL + realizedPL;

    return {
      totalInvested,
      currentValue,
      unrealizedPL,
      realizedPL,
      totalPL,
      totalPLPercent: totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0,
      openPositions: openTrades.length,
      closedPositions: closedTrades.length
    };
  }
}

export const tradingSimulator = new TradingSimulatorService();