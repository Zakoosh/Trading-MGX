// أنواع البيانات للنظام

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema: number;
  adx: number;
}

export interface Signal {
  id: string;
  symbol: string;
  name: string;
  recommendation: 'buy' | 'sell' | 'hold';
  strength: 'strong' | 'medium' | 'weak';
  price: number;
  targetPrice: number;
  stopLoss: number;
  indicators: TechnicalIndicators;
  notes: string;
  confidence: number;
  timestamp: Date;
  aiProvider?: 'gemini' | 'openai';
}

export interface SignalEvaluation {
  id: string;
  signalId: string;
  symbol: string;
  entryPrice: number;
  priceAfterOneHour: number;
  priceChange: number;
  priceChangePercent: number;
  accuracy: number;
  isCorrect: boolean;
  grade: 'excellent' | 'good' | 'fair' | 'poor';
  improvementNotes: string;
  evaluatedAt: Date;
}

export interface Trade {
  id: string;
  signalId: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  profit: number;
  profitPercent: number;
  status: 'open' | 'closed';
  openedAt: Date;
  closedAt?: Date;
}

export interface Portfolio {
  totalValue: number;
  cash: number;
  investedAmount: number;
  totalPL: number;
  totalPLPercent: number;
  openPositions: number;
  closedPositions: number;
  winRate: number;
  trades: Trade[];
}

export interface PerformanceMetrics {
  date: string;
  totalSignals: number;
  correctSignals: number;
  accuracy: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  averageProfit: number;
  bestTrade: Trade | null;
  worstTrade: Trade | null;
}

export interface ImprovementSuggestion {
  id: string;
  category: 'indicator' | 'strategy' | 'risk_management';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implemented: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'signal' | 'trade' | 'report' | 'evaluation' | 'improvement';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface DailyReport {
  id: string;
  date: string;
  signals: Signal[];
  evaluations: SignalEvaluation[];
  trades: Trade[];
  metrics: PerformanceMetrics;
  improvements: ImprovementSuggestion[];
  summary: string;
  createdAt: Date;
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  dailyReports: DailyReport[];
  totalSignals: number;
  averageAccuracy: number;
  totalProfit: number;
  winRate: number;
  topPerformers: Stock[];
  worstPerformers: Stock[];
  keyInsights: string[];
  createdAt: Date;
}

export interface RealTradingConfig {
  enabled: boolean;
  broker: 'alpaca' | 'binance' | 'interactive_brokers' | null;
  apiKey: string;
  apiSecret: string;
  initialCapital: number;
  maxPositionSize: number;
  maxDailyLoss: number;
  minConfidenceThreshold: number;
}

export interface RealTrade extends Trade {
  orderId: string;
  broker: string;
  commission: number;
  slippage: number;
  executionTime: Date;
}