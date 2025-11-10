import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';
import { tradingSimulator } from '@/services/tradingSimulator';
import { aiAnalyzer } from '@/services/aiAnalyzer';

export default function PerformanceTracker() {
  const [performance, setPerformance] = useState({
    date: new Date(),
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalProfit: 0,
    totalLoss: 0,
    netProfit: 0,
    winRate: 0,
    strongSignals: [] as string[],
    weakSignals: [] as string[]
  });

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      // توليد بيانات تجريبية للأداء
      const signals = await aiAnalyzer.analyzeMarket();
      const trades = await tradingSimulator.simulateDailyTrading(signals);
      const dailyPerf = tradingSimulator.calculateDailyPerformance(trades);
      
      const strongSignals = signals
        .filter(s => s.strength === 'strong' && s.signal !== 'hold')
        .map(s => s.symbol);
      
      const weakSignals = signals
        .filter(s => s.strength === 'weak' && s.signal !== 'hold')
        .map(s => s.symbol);

      setPerformance({
        ...dailyPerf,
        strongSignals,
        weakSignals
      });
    } catch (error) {
      console.error('خطأ في تحميل الأداء:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getPerformanceGrade = (winRate: number) => {
    if (winRate >= 70) return { grade: 'ممتاز', color: 'text-green-600', icon: Award };
    if (winRate >= 50) return { grade: 'جيد', color: 'text-blue-600', icon: Target };
    return { grade: 'يحتاج تحسين', color: 'text-orange-600', icon: TrendingUp };
  };

  const performanceGrade = getPerformanceGrade(performance.winRate);
  const GradeIcon = performanceGrade.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">متتبع الأداء</h2>
        <p className="text-muted-foreground">تحليل شامل لأداء التداول اليومي</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الصفقات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performance.totalTrades}</div>
            <p className="text-xs text-muted-foreground">
              {performance.winningTrades} رابحة • {performance.losingTrades} خاسرة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
            <GradeIcon className={`h-4 w-4 ${performanceGrade.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${performanceGrade.color}`}>
              {performance.winRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{performanceGrade.grade}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
            <TrendingUp className={`h-4 w-4 ${performance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${performance.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(performance.netProfit)}
            </div>
            <p className="text-xs text-muted-foreground">اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة الربح/الخسارة</CardTitle>
            <Badge variant="outline">
              {performance.totalTrades > 0 
                ? (performance.totalProfit / (performance.totalProfit + performance.totalLoss) * 100).toFixed(0) 
                : 0}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-green-600">ربح: {formatCurrency(performance.totalProfit)}</span>
                <span className="text-red-600">خسارة: {formatCurrency(performance.totalLoss)}</span>
              </div>
              <Progress 
                value={performance.totalTrades > 0 
                  ? (performance.totalProfit / (performance.totalProfit + performance.totalLoss) * 100) 
                  : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              إشارات قوية
            </CardTitle>
            <CardDescription>الأسهم ذات الإشارات القوية اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.strongSignals.length > 0 ? (
                performance.strongSignals.map((symbol) => (
                  <div key={symbol} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="font-medium">{symbol}</span>
                    <Badge className="bg-green-600">قوية</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد إشارات قوية اليوم
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              إشارات ضعيفة
            </CardTitle>
            <CardDescription>الأسهم ذات الإشارات الضعيفة اليوم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.weakSignals.length > 0 ? (
                performance.weakSignals.map((symbol) => (
                  <div key={symbol} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <span className="font-medium">{symbol}</span>
                    <Badge variant="secondary">ضعيفة</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد إشارات ضعيفة اليوم
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📊 ملخص الأداء اليومي</CardTitle>
          <CardDescription>
            التاريخ: {new Date().toLocaleDateString('ar-SA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">الصفقات الرابحة</p>
              <p className="text-2xl font-bold text-green-600">{performance.winningTrades}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">الصفقات الخاسرة</p>
              <p className="text-2xl font-bold text-red-600">{performance.losingTrades}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الربح</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(performance.totalProfit)}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">إجمالي الخسارة</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(performance.totalLoss)}</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
            <h4 className="font-semibold mb-2">💡 التوصيات</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {performance.winRate >= 70 && (
                <li>✅ أداء ممتاز! استمر على نفس الاستراتيجية</li>
              )}
              {performance.winRate < 50 && (
                <li>⚠️ يُنصح بمراجعة استراتيجية التداول</li>
              )}
              {performance.strongSignals.length > 5 && (
                <li>🎯 يوجد عدد كبير من الفرص القوية اليوم</li>
              )}
              {performance.netProfit > 0 && (
                <li>💰 تحقيق ربح صافي إيجابي اليوم</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}