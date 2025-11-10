import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, TrendingUp, TrendingDown, Minus, Search, Archive, ListChecks, RefreshCw, Send } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { telegramService } from '@/services/telegramService';
import { marketDataService } from '@/services/marketDataService';
import { Signal } from '@/types/trading';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/utils/dateFormatter';

interface WatchlistStock {
  symbol: string;
  name: string;
  market: string;
  type: string;
  sharia_compliant: boolean;
}

const DEFAULT_WATCHLIST: WatchlistStock[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'MSFT', name: 'Microsoft Corp.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'META', name: 'Meta Platforms Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'JNJ', name: 'Johnson & Johnson', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'PG', name: 'Procter & Gamble Co.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'AVGO', name: 'Broadcom Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'CAN', name: 'Canaan Inc.', market: 'US', type: 'Stock', sharia_compliant: true },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', market: 'Crypto', type: 'Currency Pair', sharia_compliant: true },
  { symbol: 'XAU/USD', name: 'Gold / US Dollar', market: 'Commodities', type: 'Commodity', sharia_compliant: true },
  { symbol: 'BIMAS.IS', name: 'BIM Birleşik Mağazalar', market: 'Turkey', type: 'Stock', sharia_compliant: true },
  { symbol: 'ASELS.IS', name: 'Aselsan Elektronik', market: 'Turkey', type: 'Stock', sharia_compliant: true },
  { symbol: 'TUPRS.IS', name: 'Tüpraş Petrol', market: 'Turkey', type: 'Stock', sharia_compliant: true },
  { symbol: 'AKSA.IS', name: 'Aksa Akrilik', market: 'Turkey', type: 'Stock', sharia_compliant: true }
];

export default function AIAnalyzer() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [archivedSignals, setArchivedSignals] = useState<Signal[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [analyzingWatchlist, setAnalyzingWatchlist] = useState(false);

  useEffect(() => {
    const savedSignals = localStorage.getItem('ai_signals');
    const savedArchived = localStorage.getItem('ai_archived_signals');
    
    if (savedSignals) {
      try {
        const parsed = JSON.parse(savedSignals);
        setSignals(parsed.map((s: Signal) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })));
      } catch (error) {
        console.error('Error loading saved signals:', error);
      }
    }
    
    if (savedArchived) {
      try {
        const parsed = JSON.parse(savedArchived);
        setArchivedSignals(parsed.map((s: Signal) => ({
          ...s,
          timestamp: new Date(s.timestamp)
        })));
      } catch (error) {
        console.error('Error loading archived signals:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (signals.length > 0) {
      localStorage.setItem('ai_signals', JSON.stringify(signals));
    }
  }, [signals]);

  useEffect(() => {
    if (archivedSignals.length > 0) {
      localStorage.setItem('ai_archived_signals', JSON.stringify(archivedSignals));
    }
  }, [archivedSignals]);

  const analyzeStock = async (stockSymbol?: string, stockName?: string): Promise<Signal | null> => {
    const targetSymbol = stockSymbol || symbol;
    const targetName = stockName || `شركة ${targetSymbol.toUpperCase()}`;
    
    if (!targetSymbol.trim()) {
      toast.error('الرجاء إدخال رمز السهم');
      return null;
    }

    setLoading(true);
    try {
      // جلب البيانات الحقيقية من Twelve Data
      const priceData = await marketDataService.getStockPrice(targetSymbol);
      const rsiData = await marketDataService.getTechnicalIndicator(targetSymbol, 'rsi');
      const macdData = await marketDataService.getTechnicalIndicator(targetSymbol, 'macd');
      const emaData = await marketDataService.getTechnicalIndicator(targetSymbol, 'ema');
      const adxData = await marketDataService.getTechnicalIndicator(targetSymbol, 'adx');

      if (!priceData) {
        throw new Error('فشل جلب بيانات السعر');
      }

      const mockStockData = {
        symbol: targetSymbol.toUpperCase(),
        name: targetName,
        price: priceData.price,
        rsi: rsiData?.values?.[0]?.rsi ? parseFloat(rsiData.values[0].rsi) : 50,
        macd: macdData?.values?.[0]?.macd ? parseFloat(macdData.values[0].macd) : 0,
        macdSignal: macdData?.values?.[0]?.macd_signal ? parseFloat(macdData.values[0].macd_signal) : 0,
        ema: emaData?.values?.[0]?.ema ? parseFloat(emaData.values[0].ema) : priceData.price,
        adx: adxData?.values?.[0]?.adx ? parseFloat(adxData.values[0].adx) : 25
      };

      const result = await aiService.analyzeStock(mockStockData);

      if (result.success && result.data) {
        const newSignal: Signal = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          symbol: mockStockData.symbol,
          name: mockStockData.name,
          recommendation: result.data.recommendation,
          strength: result.data.strength,
          price: mockStockData.price,
          targetPrice: result.data.targetPrice,
          stopLoss: result.data.stopLoss,
          indicators: {
            rsi: mockStockData.rsi,
            macd: mockStockData.macd,
            macdSignal: mockStockData.macdSignal,
            macdHistogram: mockStockData.macd - mockStockData.macdSignal,
            ema: mockStockData.ema,
            adx: mockStockData.adx
          },
          notes: result.data.notes,
          confidence: result.data.confidence,
          timestamp: new Date(),
          aiProvider: result.provider
        };

        setSignals(prev => [newSignal, ...prev]);
        toast.success(`تم تحليل ${targetSymbol.toUpperCase()} بنجاح`);
        
        if (!stockSymbol) {
          setSymbol('');
        }

        return newSignal;
      } else {
        toast.error(result.error || 'فشل التحليل');
        return null;
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء التحليل');
      console.error(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeWatchlist = async () => {
    setAnalyzingWatchlist(true);
    const analysisResults: Signal[] = [];
    let successCount = 0;
    let failCount = 0;
    
    let watchlist = DEFAULT_WATCHLIST;
    
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', user.id);
          
          if (!error && data && data.length > 0) {
            watchlist = data;
          }
        }
      } catch (error) {
        console.error('Error loading watchlist:', error);
      }
    }
    
    toast.info(`بدء تحليل ${watchlist.length} سهم من قائمة المتابعة...`);
    
    for (let i = 0; i < watchlist.length; i++) {
      const stock = watchlist[i];
      try {
        const signal = await analyzeStock(stock.symbol, stock.name);
        
        if (signal) {
          analysisResults.push(signal);
          successCount++;
          
          // إرسال تلقائي إلى المقيم الذكي - استخدام قائمة بدلاً من استبدال
          const existingSignals = localStorage.getItem('signals_for_evaluation');
          const signalsList = existingSignals ? JSON.parse(existingSignals) : [];
          signalsList.push(signal);
          localStorage.setItem('signals_for_evaluation', JSON.stringify(signalsList));
          
          // حفظ التحليل في Supabase
          if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('watchlist').upsert({
                user_id: user.id,
                symbol: stock.symbol,
                name: stock.name,
                market: stock.market,
                type: stock.type,
                sharia_compliant: stock.sharia_compliant,
                last_analysis: {
                  recommendation: signal.recommendation,
                  strength: signal.strength,
                  confidence: signal.confidence,
                  timestamp: new Date().toISOString()
                },
                updated_at: new Date().toISOString()
              });
            }
          }
        } else {
          failCount++;
        }
        
        toast.info(`تم تحليل ${successCount}/${watchlist.length} سهم...`);
        
        if (i < watchlist.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (error) {
        failCount++;
        console.error(`Failed to analyze ${stock.symbol}:`, error);
      }
    }
    
    setAnalyzingWatchlist(false);
    
    // إرسال تقرير Telegram
    if (analysisResults.length > 0) {
      const telegramResults = analysisResults.map(signal => ({
        symbol: signal.symbol,
        name: signal.name,
        price: signal.price,
        recommendation: signal.recommendation,
        confidence: signal.confidence,
        strength: signal.strength
      }));
      
      const telegramSent = await telegramService.sendDailyReport(telegramResults);
      
      if (telegramSent) {
        toast.success('✅ تم إرسال التقرير إلى Telegram');
      } else {
        toast.warning('⚠️ فشل إرسال التقرير إلى Telegram');
      }
    }
    
    if (failCount === 0) {
      toast.success(`✅ تم تحليل جميع الأسهم وإرسالها للمقيم (${successCount}/${watchlist.length})`);
    } else {
      toast.warning(`⚠️ تم تحليل ${successCount} سهم، فشل ${failCount} سهم`);
    }
  };

  const archiveSignal = (signalId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (signal) {
      setArchivedSignals(prev => [signal, ...prev]);
      setSignals(prev => prev.filter(s => s.id !== signalId));
      toast.success('تم أرشفة الإشارة');
    }
  };

  const restoreSignal = (signalId: string) => {
    const signal = archivedSignals.find(s => s.id === signalId);
    if (signal) {
      setSignals(prev => [signal, ...prev]);
      setArchivedSignals(prev => prev.filter(s => s.id !== signalId));
      toast.success('تم استعادة الإشارة');
    }
  };

  const sendToEvaluator = (signalId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (signal) {
      const existingSignals = localStorage.getItem('signals_for_evaluation');
      const signalsList = existingSignals ? JSON.parse(existingSignals) : [];
      signalsList.push(signal);
      localStorage.setItem('signals_for_evaluation', JSON.stringify(signalsList));
      toast.success('تم إرسال الإشارة إلى المقيم الذكي');
    }
  };

  const getRecommendationIcon = (rec: string) => {
    if (rec === 'buy') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rec === 'sell') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getRecommendationText = (rec: string) => {
    if (rec === 'buy') return 'شراء';
    if (rec === 'sell') return 'بيع';
    return 'احتفاظ';
  };

  const getStrengthColor = (strength: string) => {
    if (strength === 'strong') return 'bg-green-500';
    if (strength === 'medium') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStrengthText = (strength: string) => {
    if (strength === 'strong') return 'قوية';
    if (strength === 'medium') return 'متوسطة';
    return 'ضعيفة';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            محلل الأسهم بالذكاء الاصطناعي
          </CardTitle>
          <CardDescription>
            أدخل رمز السهم للحصول على تحليل شامل وتوصية استثمارية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="مثال: AAPL, TSLA, GOOGL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && analyzeStock()}
              className="text-right"
              disabled={loading || analyzingWatchlist}
            />
            <Button onClick={() => analyzeStock()} disabled={loading || analyzingWatchlist}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                'تحليل'
              )}
            </Button>
            <Button 
              onClick={analyzeWatchlist} 
              disabled={loading || analyzingWatchlist}
              variant="secondary"
              className="gap-2"
            >
              {analyzingWatchlist ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <ListChecks className="h-4 w-4" />
                  تحليل قائمة المتابعة
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {showArchive ? 'الإشارات المؤرشفة' : 'سجل التحليلات'} ({showArchive ? archivedSignals.length : signals.length})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchive(!showArchive)}
        >
          <Archive className="ml-2 h-4 w-4" />
          {showArchive ? 'عرض النشطة' : 'عرض الأرشيف'}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">السهم</TableHead>
                <TableHead className="text-right">التوصية</TableHead>
                <TableHead className="text-right">القوة</TableHead>
                <TableHead className="text-right">السعر</TableHead>
                <TableHead className="text-right">الهدف</TableHead>
                <TableHead className="text-right">وقف الخسارة</TableHead>
                <TableHead className="text-right">الثقة</TableHead>
                <TableHead className="text-right">AI</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showArchive ? archivedSignals : signals).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    {showArchive ? 'لا توجد إشارات مؤرشفة' : 'لا توجد تحليلات محفوظة'}
                  </TableCell>
                </TableRow>
              ) : (
                (showArchive ? archivedSignals : signals).map((signal) => (
                  <TableRow key={signal.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-bold">{signal.symbol}</div>
                        <div className="text-xs text-muted-foreground">{signal.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(signal.recommendation)}
                        <span>{getRecommendationText(signal.recommendation)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStrengthColor(signal.strength)}>
                        {getStrengthText(signal.strength)}
                      </Badge>
                    </TableCell>
                    <TableCell>${signal.price.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">${signal.targetPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-red-600">${signal.stopLoss.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{signal.confidence}%</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {signal.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(signal.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!showArchive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendToEvaluator(signal.id)}
                            title="إرسال إلى المقيم الذكي"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showArchive ? restoreSignal(signal.id) : archiveSignal(signal.id)}
                        >
                          {showArchive ? 'استعادة' : 'أرشفة'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!showArchive && signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>ملاحظات التحليل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {signals.slice(0, 5).map((signal) => (
                <div key={signal.id} className="border-r-4 border-blue-500 pr-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{signal.symbol}</div>
                      <p className="text-sm text-muted-foreground">{signal.notes}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(signal.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}