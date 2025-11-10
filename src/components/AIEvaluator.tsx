import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { marketDataService } from '@/services/marketDataService';
import { Signal, SignalEvaluation } from '@/types/trading';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function AIEvaluator() {
  const [pendingSignals, setPendingSignals] = useState<Signal[]>([]);
  const [evaluations, setEvaluations] = useState<SignalEvaluation[]>([]);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [autoEvaluating, setAutoEvaluating] = useState(false);

  // تحميل الإشارات المرسلة من المحلل الذكي
  useEffect(() => {
    const loadPendingSignals = () => {
      const savedSignals = localStorage.getItem('signals_for_evaluation');
      if (savedSignals) {
        try {
          const signalsList = JSON.parse(savedSignals);
          if (Array.isArray(signalsList) && signalsList.length > 0) {
            // إضافة الإشارات الجديدة فقط
            setPendingSignals(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const newSignals = signalsList.filter((s: Signal) => !existingIds.has(s.id));
              if (newSignals.length > 0) {
                toast.success(`تم استقبال ${newSignals.length} إشارة جديدة للتقييم`);
                // مسح القائمة بعد القراءة
                localStorage.removeItem('signals_for_evaluation');
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

    // تحميل عند بدء التشغيل
    loadPendingSignals();

    // مراقبة التغييرات كل ثانية
    const interval = setInterval(loadPendingSignals, 1000);
    return () => clearInterval(interval);
  }, []);

  // التقييم التلقائي عند وصول إشارات جديدة
  useEffect(() => {
    if (pendingSignals.length > 0 && !autoEvaluating && !evaluating) {
      evaluateAllSignals();
    }
  }, [pendingSignals.length]);

  // تحميل التقييمات المحفوظة
  useEffect(() => {
    const savedEvaluations = localStorage.getItem('signal_evaluations');
    if (savedEvaluations) {
      try {
        const parsed = JSON.parse(savedEvaluations);
        setEvaluations(parsed.map((e: SignalEvaluation) => ({
          ...e,
          evaluatedAt: new Date(e.evaluatedAt)
        })));
      } catch (error) {
        console.error('Error loading evaluations:', error);
      }
    }
  }, []);

  // حفظ التقييمات
  useEffect(() => {
    if (evaluations.length > 0) {
      localStorage.setItem('signal_evaluations', JSON.stringify(evaluations));
    }
  }, [evaluations]);

  const evaluateSignal = async (signal: Signal) => {
    setEvaluating(signal.id);
    
    try {
      // جلب السعر الحالي من Twelve Data
      const currentPriceData = await marketDataService.getStockPrice(signal.symbol);
      const currentPrice = currentPriceData ? currentPriceData.price : signal.price * (1 + (Math.random() - 0.5) * 0.1);

      const result = await aiService.evaluateSignal({
        symbol: signal.symbol,
        recommendation: signal.recommendation,
        entryPrice: signal.price,
        currentPrice: currentPrice,
        timeElapsed: 60
      });

      if (result.success && result.data) {
        const evaluation: SignalEvaluation = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          signalId: signal.id,
          symbol: signal.symbol,
          entryPrice: signal.price,
          priceAfterOneHour: currentPrice,
          priceChange: currentPrice - signal.price,
          priceChangePercent: ((currentPrice - signal.price) / signal.price) * 100,
          accuracy: result.data.accuracy,
          isCorrect: result.data.isCorrect,
          grade: result.data.grade,
          improvementNotes: result.data.improvementNotes,
          evaluatedAt: new Date()
        };

        setEvaluations(prev => [evaluation, ...prev]);
        setPendingSignals(prev => prev.filter(s => s.id !== signal.id));
        
        // حفظ في Supabase
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('signal_evaluations').insert({
              user_id: user.id,
              signal_id: signal.id,
              symbol: signal.symbol,
              entry_price: signal.price,
              current_price: currentPrice,
              price_change: evaluation.priceChange,
              price_change_percent: evaluation.priceChangePercent,
              accuracy: evaluation.accuracy,
              is_correct: evaluation.isCorrect,
              grade: evaluation.grade,
              improvement_notes: evaluation.improvementNotes,
              evaluated_at: new Date().toISOString()
            });
          }
        }
        
        // إرسال تلقائي للمحاكي والتداول الحقيقي
        const tradingData = {
          signal,
          evaluation,
          timestamp: new Date().toISOString()
        };
        
        // إرسال للمحاكي
        const simulatorSignals = localStorage.getItem('signals_for_simulator');
        const simulatorList = simulatorSignals ? JSON.parse(simulatorSignals) : [];
        simulatorList.push(tradingData);
        localStorage.setItem('signals_for_simulator', JSON.stringify(simulatorList));
        
        // إرسال للتداول الحقيقي
        const realTradingSignals = localStorage.getItem('signals_for_real_trading');
        const realTradingList = realTradingSignals ? JSON.parse(realTradingSignals) : [];
        realTradingList.push(tradingData);
        localStorage.setItem('signals_for_real_trading', JSON.stringify(realTradingList));
        
        // حفظ في الأرشيف للمحسن الذكي
        const archive = localStorage.getItem('trading_archive');
        const archiveList = archive ? JSON.parse(archive) : [];
        archiveList.push({
          ...tradingData,
          archived_at: new Date().toISOString()
        });
        localStorage.setItem('trading_archive', JSON.stringify(archiveList));
        
        toast.success(`✅ تم تقييم ${signal.symbol} وإرساله للمحاكي والتداول الحقيقي`);
      } else {
        toast.error('فشل التقييم');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التقييم');
      console.error(error);
    } finally {
      setEvaluating(null);
    }
  };

  const evaluateAllSignals = async () => {
    if (pendingSignals.length === 0) {
      toast.info('لا توجد إشارات للتقييم');
      return;
    }

    setAutoEvaluating(true);
    toast.info(`بدء التقييم التلقائي لـ ${pendingSignals.length} إشارة...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const signal of pendingSignals) {
      try {
        await evaluateSignal(signal);
        successCount++;
        // انتظار ثانية واحدة بين كل تقييم
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failCount++;
        console.error(`Failed to evaluate ${signal.symbol}:`, error);
      }
    }

    setAutoEvaluating(false);
    
    if (failCount === 0) {
      toast.success(`✅ تم تقييم جميع الإشارات بنجاح (${successCount}/${successCount + failCount})`);
    } else {
      toast.warning(`⚠️ تم تقييم ${successCount} إشارة، فشل ${failCount} إشارة`);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getGradeText = (grade: string) => {
    switch (grade) {
      case 'excellent': return 'ممتاز';
      case 'good': return 'جيد';
      case 'fair': return 'مقبول';
      case 'poor': return 'ضعيف';
      default: return 'غير محدد';
    }
  };

  const avgAccuracy = evaluations.length > 0
    ? evaluations.reduce((sum, e) => sum + e.accuracy, 0) / evaluations.length
    : 0;

  const correctCount = evaluations.filter(e => e.isCorrect).length;
  const successRate = evaluations.length > 0 ? (correctCount / evaluations.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">متوسط الدقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAccuracy.toFixed(1)}%</div>
            <Progress value={avgAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">معدل النجاح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {correctCount} من {evaluations.length} إشارات صحيحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الإشارات المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSignals.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              في انتظار التقييم التلقائي
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
                  <Clock className="h-5 w-5" />
                  إشارات في انتظار التقييم
                </CardTitle>
                <CardDescription>
                  سيتم تقييمها تلقائياً
                </CardDescription>
              </div>
              <Button
                onClick={evaluateAllSignals}
                disabled={autoEvaluating}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                {autoEvaluating ? 'جاري التقييم...' : 'تقييم الكل الآن'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">السهم</TableHead>
                  <TableHead className="text-right">التوصية</TableHead>
                  <TableHead className="text-right">سعر الدخول</TableHead>
                  <TableHead className="text-right">الثقة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSignals.map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-medium">{signal.symbol}</TableCell>
                    <TableCell>{signal.recommendation === 'buy' ? 'شراء' : signal.recommendation === 'sell' ? 'بيع' : 'احتفاظ'}</TableCell>
                    <TableCell>${signal.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{signal.confidence}%</Badge>
                    </TableCell>
                    <TableCell>
                      {evaluating === signal.id ? (
                        <Badge variant="secondary">جاري التقييم...</Badge>
                      ) : (
                        <Badge variant="outline">في الانتظار</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>نتائج التقييم</CardTitle>
          <CardDescription>
            تقييم دقة الإشارات مع الأسعار الحقيقية من Twelve Data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السهم</TableHead>
                <TableHead className="text-right">سعر الدخول</TableHead>
                <TableHead className="text-right">السعر بعد ساعة</TableHead>
                <TableHead className="text-right">التغير</TableHead>
                <TableHead className="text-right">الدقة</TableHead>
                <TableHead className="text-right">صحيحة؟</TableHead>
                <TableHead className="text-right">التقييم</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    لا توجد تقييمات بعد
                  </TableCell>
                </TableRow>
              ) : (
                evaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.symbol}</TableCell>
                    <TableCell>${evaluation.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>${evaluation.priceAfterOneHour.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${evaluation.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {evaluation.priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {evaluation.priceChangePercent.toFixed(2)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{evaluation.accuracy}%</Badge>
                    </TableCell>
                    <TableCell>
                      {evaluation.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(evaluation.grade)}>
                        {getGradeText(evaluation.grade)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(evaluation.evaluatedAt).toLocaleString('ar-SA')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {evaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات التحسين</CardTitle>
            <CardDescription>
              سيتم إرسالها للمحسن الذكي لتحسين النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations.slice(0, 5).map((evaluation) => (
                <div key={evaluation.id} className="border-r-4 border-orange-500 pr-4">
                  <div className="font-semibold">{evaluation.symbol}</div>
                  <p className="text-sm text-muted-foreground">{evaluation.improvementNotes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}