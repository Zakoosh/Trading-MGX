import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, TrendingDown, Activity, PieChart, Zap } from 'lucide-react';
import { Trade, Portfolio, Signal, SignalEvaluation } from '@/types/trading';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/dateFormatter';
import { supabase } from '@/lib/supabase';

interface SignalWithEvaluation {
  signal: Signal;
  evaluation: SignalEvaluation;
}

const INITIAL_PORTFOLIO: Portfolio = {
  totalValue: 100000,
  cash: 100000,
  investedAmount: 0,
  totalPL: 0,
  totalPLPercent: 0,
  openPositions: 0,
  closedPositions: 0,
  winRate: 0,
  trades: []
};

export default function AISimulator() {
  const [portfolio, setPortfolio] = useState<Portfolio>(INITIAL_PORTFOLIO);

  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    type: 'buy' as 'buy' | 'sell',
    price: '',
    quantity: ''
  });

  const [pendingSignals, setPendingSignals] = useState<SignalWithEvaluation[]>([]);
  const [autoTrading, setAutoTrading] = useState(false);

  // تحميل المحفظة من localStorage عند بدء التشغيل
  useEffect(() => {
    const savedPortfolio = localStorage.getItem('simulator_portfolio');
    if (savedPortfolio) {
      try {
        const parsed = JSON.parse(savedPortfolio);
        // تحويل التواريخ من string إلى Date
        const portfolioWithDates = {
          ...parsed,
          trades: parsed.trades.map((t: Trade) => ({
            ...t,
            openedAt: new Date(t.openedAt),
            closedAt: t.closedAt ? new Date(t.closedAt) : undefined
          }))
        };
        setPortfolio(portfolioWithDates);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }
    }
  }, []);

  // حفظ المحفظة في localStorage عند كل تغيير
  useEffect(() => {
    if (portfolio.trades.length > 0 || portfolio.totalValue !== INITIAL_PORTFOLIO.totalValue) {
      localStorage.setItem('simulator_portfolio', JSON.stringify(portfolio));
    }
  }, [portfolio]);

  // تحميل الإشارات من المقيم الذكي
  useEffect(() => {
    const loadSignals = () => {
      const savedSignals = localStorage.getItem('signals_for_simulator');
      if (savedSignals) {
        try {
          const signalsList = JSON.parse(savedSignals);
          if (Array.isArray(signalsList) && signalsList.length > 0) {
            setPendingSignals(prev => {
              const existingIds = new Set(prev.map(s => s.signal.id));
              const newSignals = signalsList.filter((s: SignalWithEvaluation) => !existingIds.has(s.signal.id));
              if (newSignals.length > 0) {
                toast.success(`تم استقبال ${newSignals.length} إشارة جديدة للمحاكاة`);
                localStorage.removeItem('signals_for_simulator');
                return [...prev, ...newSignals];
              }
              return prev;
            });
          }
        } catch (error) {
          console.error('Error loading signals:', error);
        }
      }
    };

    loadSignals();
    const interval = setInterval(loadSignals, 1000);
    return () => clearInterval(interval);
  }, []);

  // تنفيذ تلقائي للإشارات
  useEffect(() => {
    if (pendingSignals.length > 0 && !autoTrading) {
      executeAllSignals();
    }
  }, [pendingSignals.length]);

  const executeSignalTrade = async (signalData: SignalWithEvaluation) => {
    const { signal } = signalData;
    
    // تحديد الكمية بناءً على رأس المال المتاح
    const maxInvestment = portfolio.cash * 0.1; // 10% من الرصيد لكل صفقة
    const quantity = Math.floor(maxInvestment / signal.price);
    
    if (quantity === 0) {
      toast.error(`رصيد غير كافٍ لتنفيذ صفقة ${signal.symbol}`);
      return false;
    }

    const tradeValue = signal.price * quantity;

    const newTrade: Trade = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      signalId: signal.id,
      symbol: signal.symbol,
      name: signal.name,
      type: signal.recommendation === 'buy' ? 'buy' : 'sell',
      entryPrice: signal.price,
      currentPrice: signal.price,
      quantity: quantity,
      profit: 0,
      profitPercent: 0,
      status: 'open',
      openedAt: new Date()
    };

    const newCash = portfolio.cash - tradeValue;
    const newInvested = portfolio.investedAmount + tradeValue;

    const updatedPortfolio = {
      ...portfolio,
      cash: newCash,
      investedAmount: newInvested,
      totalValue: newCash + newInvested,
      openPositions: portfolio.openPositions + 1,
      trades: [newTrade, ...portfolio.trades]
    };

    setPortfolio(updatedPortfolio);

    // حفظ في Supabase
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('simulated_trades').insert({
          user_id: user.id,
          signal_id: signal.id,
          symbol: signal.symbol,
          type: newTrade.type,
          entry_price: signal.price,
          quantity: quantity,
          status: 'open',
          opened_at: new Date().toISOString()
        });
      }
    }

    toast.success(`✅ تم تنفيذ صفقة ${signal.symbol} - ${signal.recommendation.toUpperCase()}`);
    return true;
  };

  const executeAllSignals = async () => {
    if (pendingSignals.length === 0) return;

    setAutoTrading(true);
    toast.info(`بدء تنفيذ ${pendingSignals.length} صفقة تلقائياً...`);

    let successCount = 0;
    let failCount = 0;

    for (const signalData of pendingSignals) {
      try {
        const success = await executeSignalTrade(signalData);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
        console.error(`Failed to execute ${signalData.signal.symbol}:`, error);
      }
    }

    setPendingSignals([]);
    setAutoTrading(false);

    if (failCount === 0) {
      toast.success(`✅ تم تنفيذ جميع الصفقات بنجاح (${successCount}/${successCount + failCount})`);
    } else {
      toast.warning(`⚠️ تم تنفيذ ${successCount} صفقة، فشل ${failCount} صفقة`);
    }
  };

  const executeTrade = () => {
    const { symbol, type, price, quantity } = tradeForm;

    if (!symbol || !price || !quantity) {
      toast.error('الرجاء ملء جميع الحقول');
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);
    const tradeValue = priceNum * quantityNum;

    if (type === 'buy' && tradeValue > portfolio.cash) {
      toast.error('رصيد غير كافٍ');
      return;
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      signalId: '',
      symbol: symbol.toUpperCase(),
      name: `شركة ${symbol.toUpperCase()}`,
      type,
      entryPrice: priceNum,
      currentPrice: priceNum,
      quantity: quantityNum,
      profit: 0,
      profitPercent: 0,
      status: 'open',
      openedAt: new Date()
    };

    const newCash = type === 'buy' ? portfolio.cash - tradeValue : portfolio.cash + tradeValue;
    const newInvested = type === 'buy' ? portfolio.investedAmount + tradeValue : portfolio.investedAmount - tradeValue;

    setPortfolio({
      ...portfolio,
      cash: newCash,
      investedAmount: newInvested,
      totalValue: newCash + newInvested,
      openPositions: portfolio.openPositions + 1,
      trades: [newTrade, ...portfolio.trades]
    });

    setTradeForm({ symbol: '', type: 'buy', price: '', quantity: '' });
    toast.success(`تم ${type === 'buy' ? 'شراء' : 'بيع'} ${symbol.toUpperCase()}`);
  };

  const closeTrade = (tradeId: string) => {
    const trade = portfolio.trades.find(t => t.id === tradeId);
    if (!trade || trade.status === 'closed') return;

    // محاكاة سعر الإغلاق (في الواقع سيأتي من API)
    const closePrice = trade.currentPrice + (Math.random() - 0.5) * 10;
    const profit = trade.type === 'buy' 
      ? (closePrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - closePrice) * trade.quantity;
    const profitPercent = (profit / (trade.entryPrice * trade.quantity)) * 100;

    const updatedTrade = {
      ...trade,
      currentPrice: closePrice,
      profit,
      profitPercent,
      status: 'closed' as const,
      closedAt: new Date()
    };

    const updatedTrades = portfolio.trades.map(t => t.id === tradeId ? updatedTrade : t);
    const closedTrades = updatedTrades.filter(t => t.status === 'closed');
    const totalProfit = closedTrades.reduce((sum, t) => sum + t.profit, 0);
    const winningTrades = closedTrades.filter(t => t.profit > 0).length;

    setPortfolio({
      ...portfolio,
      cash: portfolio.cash + (trade.entryPrice * trade.quantity) + profit,
      investedAmount: portfolio.investedAmount - (trade.entryPrice * trade.quantity),
      totalPL: totalProfit,
      totalPLPercent: (totalProfit / 100000) * 100,
      openPositions: portfolio.openPositions - 1,
      closedPositions: portfolio.closedPositions + 1,
      winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
      trades: updatedTrades
    });

    toast.success(`تم إغلاق صفقة ${trade.symbol} بربح ${profit.toFixed(2)}$`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              إجمالي القيمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString()}</div>
            <p className={`text-xs mt-1 ${portfolio.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio.totalPL >= 0 ? '+' : ''}{portfolio.totalPLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              الرصيد النقدي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolio.cash.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              متاح للتداول
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              المبلغ المستثمر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolio.investedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolio.openPositions} صفقات مفتوحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {portfolio.closedPositions} صفقات مغلقة
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingSignals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  إشارات في انتظار التنفيذ
                </CardTitle>
                <CardDescription>
                  سيتم تنفيذها تلقائياً
                </CardDescription>
              </div>
              <Button
                onClick={executeAllSignals}
                disabled={autoTrading}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                {autoTrading ? 'جاري التنفيذ...' : 'تنفيذ الكل الآن'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingSignals.map((signalData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-semibold">{signalData.signal.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {signalData.signal.recommendation.toUpperCase()} @ ${signalData.signal.price.toFixed(2)}
                    </div>
                  </div>
                  <Badge variant="outline">
                    ثقة {signalData.signal.confidence}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تنفيذ صفقة جديدة (يدوي)</CardTitle>
          <CardDescription>
            قم بمحاكاة صفقة شراء أو بيع يدوياً
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>رمز السهم</Label>
              <Input
                placeholder="AAPL"
                value={tradeForm.symbol}
                onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value })}
                className="text-right"
              />
            </div>
            <div>
              <Label>النوع</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={tradeForm.type}
                onChange={(e) => setTradeForm({ ...tradeForm, type: e.target.value as 'buy' | 'sell' })}
              >
                <option value="buy">شراء</option>
                <option value="sell">بيع</option>
              </select>
            </div>
            <div>
              <Label>السعر</Label>
              <Input
                type="number"
                placeholder="150.00"
                value={tradeForm.price}
                onChange={(e) => setTradeForm({ ...tradeForm, price: e.target.value })}
                className="text-right"
              />
            </div>
            <div>
              <Label>الكمية</Label>
              <Input
                type="number"
                placeholder="100"
                value={tradeForm.quantity}
                onChange={(e) => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                className="text-right"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={executeTrade} className="w-full">
                تنفيذ الصفقة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الصفقات المفتوحة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السهم</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">سعر الدخول</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.trades.filter(t => t.status === 'open').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد صفقات مفتوحة
                  </TableCell>
                </TableRow>
              ) : (
                portfolio.trades.filter(t => t.status === 'open').map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                        {trade.type === 'buy' ? 'شراء' : 'بيع'}
                      </Badge>
                    </TableCell>
                    <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell>${(trade.entryPrice * trade.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(trade.openedAt)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => closeTrade(trade.id)}
                      >
                        إغلاق
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>سجل الصفقات المغلقة</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السهم</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">الدخول</TableHead>
                <TableHead className="text-right">الخروج</TableHead>
                <TableHead className="text-right">الربح/الخسارة</TableHead>
                <TableHead className="text-right">النسبة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolio.trades.filter(t => t.status === 'closed').length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد صفقات مغلقة
                  </TableCell>
                </TableRow>
              ) : (
                portfolio.trades.filter(t => t.status === 'closed').map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                        {trade.type === 'buy' ? 'شراء' : 'بيع'}
                      </Badge>
                    </TableCell>
                    <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>${trade.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className={trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      <div className="flex items-center gap-1">
                        {trade.profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        ${Math.abs(trade.profit).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell className={trade.profitPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {trade.profitPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {trade.closedAt && formatDateTime(trade.closedAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}