import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { tradingSimulator } from '@/services/tradingSimulator';
import { aiAnalyzer } from '@/services/aiAnalyzer';
import { TradeSimulation } from '@/types/trading';

export default function TradingSimulator() {
  const [trades, setTrades] = useState<TradeSimulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalInvested: 0,
    currentValue: 0,
    unrealizedPL: 0,
    realizedPL: 0,
    totalPL: 0,
    totalPLPercent: 0,
    openPositions: 0,
    closedPositions: 0
  });

  const loadTrades = () => {
    const demoTrades = tradingSimulator.generateDemoTrades();
    setTrades(demoTrades);
    updateStats();
  };

  const updateStats = () => {
    const portfolioStats = tradingSimulator.getPortfolioStats();
    setStats(portfolioStats);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const signals = await aiAnalyzer.analyzeMarket();
      const newTrades = await tradingSimulator.simulateDailyTrading(signals);
      setTrades([...trades, ...newTrades]);
      updateStats();
    } catch (error) {
      console.error('خطأ في المحاكاة:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">محاكي التداول</h2>
          <p className="text-muted-foreground">محاكاة واقعية لأداء الصفقات</p>
        </div>
        <Button onClick={runSimulation} disabled={loading}>
          <Play className={`ml-2 h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          تشغيل المحاكاة
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">القيمة الحالية</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.currentValue)}</div>
            <p className="text-xs text-muted-foreground">إجمالي قيمة المحفظة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الربح/الخسارة</CardTitle>
            {stats.totalPL >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.totalPL)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPLPercent >= 0 ? '+' : ''}{stats.totalPLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صفقات مفتوحة</CardTitle>
            <Badge variant="outline">{stats.openPositions}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.unrealizedPL)}</div>
            <p className="text-xs text-muted-foreground">ربح/خسارة غير محققة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صفقات مغلقة</CardTitle>
            <Badge variant="outline">{stats.closedPositions}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.realizedPL)}</div>
            <p className="text-xs text-muted-foreground">ربح/خسارة محققة</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الصفقات النشطة</CardTitle>
          <CardDescription>جميع الصفقات المفتوحة والمغلقة</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرمز</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>سعر الدخول</TableHead>
                <TableHead>السعر الحالي</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>الربح/الخسارة</TableHead>
                <TableHead>النسبة</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="font-medium">{trade.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={trade.signal === 'buy' ? 'default' : 'destructive'}>
                      {trade.signal === 'buy' ? 'شراء' : 'بيع'}
                    </Badge>
                  </TableCell>
                  <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                  <TableCell>${trade.currentPrice.toFixed(2)}</TableCell>
                  <TableCell>{trade.quantity}</TableCell>
                  <TableCell className={trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(trade.profitLoss)}
                  </TableCell>
                  <TableCell className={trade.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {trade.profitLossPercent >= 0 ? '+' : ''}{trade.profitLossPercent.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    <Badge variant={trade.status === 'open' ? 'outline' : 'secondary'}>
                      {trade.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {trades.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد صفقات حالياً. اضغط على "تشغيل المحاكاة" لبدء التداول
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}