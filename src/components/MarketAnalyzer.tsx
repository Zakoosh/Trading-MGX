import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity } from 'lucide-react';
import { aiAnalyzer } from '@/services/aiAnalyzer';
import { StockSignal } from '@/types/trading';

export default function MarketAnalyzer() {
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'hold'>('all');

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const data = await aiAnalyzer.analyzeMarket();
      setSignals(data);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, []);

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'buy':
        return <TrendingUp className="h-4 w-4" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'buy':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'sell':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getSignalText = (signal: string) => {
    switch (signal) {
      case 'buy':
        return 'شراء';
      case 'sell':
        return 'بيع';
      default:
        return 'احتفاظ';
    }
  };

  const filteredSignals = signals.filter(s => filter === 'all' || s.signal === filter);

  const strongBuySignals = signals.filter(s => s.signal === 'buy' && s.strength === 'strong');
  const strongSellSignals = signals.filter(s => s.signal === 'sell' && s.strength === 'strong');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">محلل السوق الذكي</h2>
          <p className="text-muted-foreground">تحليل فني شامل للأسهم باستخدام الذكاء الاصطناعي</p>
        </div>
        <Button onClick={loadMarketData} disabled={loading}>
          <RefreshCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إشارات الشراء القوية</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{strongBuySignals.length}</div>
            <p className="text-xs text-muted-foreground">فرص شراء عالية الجودة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إشارات البيع القوية</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{strongSellSignals.length}</div>
            <p className="text-xs text-muted-foreground">تحذيرات بيع مهمة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإشارات</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{signals.length}</div>
            <p className="text-xs text-muted-foreground">سهم تم تحليله</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإشارات التفصيلية</CardTitle>
          <CardDescription>تحليل شامل لجميع الأسهم المتابعة</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full" onValueChange={(v) => setFilter(v as 'all' | 'buy' | 'sell' | 'hold')}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">الكل ({signals.length})</TabsTrigger>
              <TabsTrigger value="buy">شراء ({signals.filter(s => s.signal === 'buy').length})</TabsTrigger>
              <TabsTrigger value="sell">بيع ({signals.filter(s => s.signal === 'sell').length})</TabsTrigger>
              <TabsTrigger value="hold">احتفاظ ({signals.filter(s => s.signal === 'hold').length})</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-4 mt-4">
              {filteredSignals.map((signal) => {
                const evaluation = aiAnalyzer.evaluateSignal(signal);
                return (
                  <Card key={signal.symbol} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold">{signal.symbol}</h3>
                            <Badge variant="outline" className={getSignalColor(signal.signal)}>
                              {getSignalIcon(signal.signal)}
                              <span className="mr-1">{getSignalText(signal.signal)}</span>
                            </Badge>
                            <Badge variant={signal.strength === 'strong' ? 'default' : 'secondary'}>
                              {signal.strength === 'strong' ? 'قوية' : 'ضعيفة'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{signal.name}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">السعر</p>
                              <p className="text-lg font-semibold">${signal.price.toFixed(2)}</p>
                              <p className={`text-xs ${signal.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {signal.change >= 0 ? '+' : ''}{signal.changePercent.toFixed(2)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">RSI</p>
                              <p className="text-lg font-semibold">{signal.rsi.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">MACD</p>
                              <p className="text-lg font-semibold">{signal.macd.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">ADX</p>
                              <p className="text-lg font-semibold">{signal.adx.toFixed(1)}</p>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">التحليل:</p>
                            <p className="text-sm text-muted-foreground">{signal.notes}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">الثقة: {evaluation.confidence}</Badge>
                              <Badge variant="outline">النقاط: {evaluation.score}/100</Badge>
                              <Badge variant={evaluation.score >= 75 ? 'default' : 'secondary'}>
                                {evaluation.recommendation}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredSignals.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  لا توجد إشارات متاحة في هذه الفئة
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}