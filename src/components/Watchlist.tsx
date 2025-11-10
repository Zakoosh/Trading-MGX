import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { aiService } from '@/services/aiService';
import { marketDataService } from '@/services/marketDataService';
import { toast } from 'sonner';
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, Plus, Trash2, Clock } from 'lucide-react';

interface WatchlistStock {
  symbol: string;
  name: string;
  market: string;
  type: string;
  sharia_compliant: boolean;
  current_price?: number;
  price_change?: number;
  price_change_percent?: number;
  last_update?: string;
  last_analysis?: {
    recommendation: string;
    strength: string;
    confidence: number;
    timestamp: string;
  };
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

export default function Watchlist() {
  const { t } = useLanguage();
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(DEFAULT_WATCHLIST);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newStock, setNewStock] = useState({
    symbol: '',
    name: '',
    market: 'US',
    type: 'Stock',
    sharia_compliant: true
  });

  useEffect(() => {
    loadWatchlist();
    updatePrices();
    
    // تحديث الأسعار كل 30 ثانية
    const interval = setInterval(updatePrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWatchlist = async () => {
    if (!supabase) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading watchlist:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setWatchlist(data);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  const updatePrices = async () => {
    setRefreshing(true);
    try {
      const symbols = watchlist.map(s => s.symbol);
      const prices = await marketDataService.getBatchPrices(symbols);
      
      const updatedWatchlist = watchlist.map(stock => {
        const priceData = prices.get(stock.symbol);
        if (priceData) {
          return {
            ...stock,
            current_price: priceData.price,
            price_change: priceData.change,
            price_change_percent: priceData.changePercent,
            last_update: priceData.timestamp
          };
        }
        return stock;
      });

      setWatchlist(updatedWatchlist);
      
      // حفظ في Supabase
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          for (const stock of updatedWatchlist) {
            await supabase.from('watchlist').upsert({
              user_id: user.id,
              symbol: stock.symbol,
              name: stock.name,
              market: stock.market,
              type: stock.type,
              sharia_compliant: stock.sharia_compliant,
              current_price: stock.current_price,
              price_change: stock.price_change,
              price_change_percent: stock.price_change_percent,
              last_update: stock.last_update,
              last_analysis: stock.last_analysis,
              updated_at: new Date().toISOString()
            });
          }
        }
      }
      
      toast.success('تم تحديث الأسعار من Twelve Data');
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('فشل تحديث الأسعار');
    } finally {
      setRefreshing(false);
    }
  };

  const analyzeStock = async (stock: WatchlistStock) => {
    setAnalyzing(stock.symbol);
    
    try {
      // جلب البيانات الحقيقية من Twelve Data
      const priceData = await marketDataService.getStockPrice(stock.symbol);
      const rsiData = await marketDataService.getTechnicalIndicator(stock.symbol, 'rsi');
      const macdData = await marketDataService.getTechnicalIndicator(stock.symbol, 'macd');
      const emaData = await marketDataService.getTechnicalIndicator(stock.symbol, 'ema');
      const adxData = await marketDataService.getTechnicalIndicator(stock.symbol, 'adx');

      if (!priceData) {
        throw new Error('فشل جلب بيانات السعر');
      }

      const stockData = {
        symbol: stock.symbol,
        name: stock.name,
        price: priceData.price,
        rsi: rsiData?.values?.[0]?.rsi ? parseFloat(rsiData.values[0].rsi) : 50,
        macd: macdData?.values?.[0]?.macd ? parseFloat(macdData.values[0].macd) : 0,
        macdSignal: macdData?.values?.[0]?.macd_signal ? parseFloat(macdData.values[0].macd_signal) : 0,
        ema: emaData?.values?.[0]?.ema ? parseFloat(emaData.values[0].ema) : priceData.price,
        adx: adxData?.values?.[0]?.adx ? parseFloat(adxData.values[0].adx) : 25
      };

      console.log('Analyzing stock with real data:', stock.symbol, stockData);
      const result = await aiService.analyzeStock(stockData);
      console.log('Analysis result:', result);

      if (result.success && result.data) {
        const analysis = {
          recommendation: result.data.recommendation as string,
          strength: result.data.strength as string,
          confidence: result.data.confidence as number,
          timestamp: new Date().toISOString()
        };

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
              current_price: stock.current_price,
              price_change: stock.price_change,
              price_change_percent: stock.price_change_percent,
              last_update: stock.last_update,
              last_analysis: analysis,
              updated_at: new Date().toISOString()
            });
          }
        }

        // تحديث القائمة المحلية
        setWatchlist(prev =>
          prev.map(s =>
            s.symbol === stock.symbol ? { ...s, last_analysis: analysis } : s
          )
        );

        toast.success(`✅ تم تحليل ${stock.symbol} - ${analysis.recommendation.toUpperCase()}`);
      } else {
        throw new Error(result.error || 'فشل التحليل');
      }
    } catch (error) {
      console.error('Error analyzing stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`❌ فشل تحليل ${stock.symbol}: ${errorMessage}`);
    } finally {
      setAnalyzing(null);
    }
  };

  const analyzeAll = async () => {
    setAutoAnalyzing(true);
    let successCount = 0;
    let failCount = 0;
    
    for (const stock of watchlist) {
      try {
        await analyzeStock(stock);
        successCount++;
        // انتظار 3 ثواني بين كل تحليل
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        failCount++;
        console.error(`Failed to analyze ${stock.symbol}:`, error);
      }
    }
    
    setAutoAnalyzing(false);
    
    if (failCount === 0) {
      toast.success(`✅ تم تحليل جميع الأسهم بنجاح (${successCount}/${watchlist.length})`);
    } else {
      toast.warning(`⚠️ تم تحليل ${successCount} سهم، فشل ${failCount} سهم`);
    }
  };

  const addStock = async () => {
    if (!newStock.symbol || !newStock.name) {
      toast.error('الرجاء إدخال رمز السهم والاسم');
      return;
    }

    const stock: WatchlistStock = {
      ...newStock,
      symbol: newStock.symbol.toUpperCase()
    };

    // حفظ في Supabase
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase.from('watchlist').insert({
            user_id: user.id,
            ...stock,
            updated_at: new Date().toISOString()
          });

          if (error) {
            toast.error('فشل إضافة السهم');
            return;
          }
        }
      } catch (error) {
        console.error('Error adding stock:', error);
        toast.error('فشل إضافة السهم');
        return;
      }
    }

    setWatchlist([...watchlist, stock]);
    setAddDialogOpen(false);
    setNewStock({
      symbol: '',
      name: '',
      market: 'US',
      type: 'Stock',
      sharia_compliant: true
    });
    toast.success(`تم إضافة ${stock.symbol} إلى قائمة المتابعة`);
  };

  const removeStock = async (symbol: string) => {
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error } = await supabase
            .from('watchlist')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', symbol);

          if (error) {
            toast.error('فشل حذف السهم');
            return;
          }
        }
      } catch (error) {
        console.error('Error removing stock:', error);
        toast.error('فشل حذف السهم');
        return;
      }
    }

    setWatchlist(watchlist.filter(s => s.symbol !== symbol));
    toast.success(`تم حذف ${symbol} من قائمة المتابعة`);
  };

  const getDataStatus = (lastUpdate?: string) => {
    if (!lastUpdate) return { color: 'text-red-500', text: 'متوقفة', icon: '🔴' };
    
    const now = new Date().getTime();
    const updateTime = new Date(lastUpdate).getTime();
    const diffMinutes = (now - updateTime) / (1000 * 60);
    
    if (diffMinutes < 5) return { color: 'text-green-500', text: 'محدثة', icon: '🟢' };
    if (diffMinutes < 15) return { color: 'text-yellow-500', text: 'متأخرة', icon: '🟡' };
    return { color: 'text-red-500', text: 'متوقفة', icon: '🔴' };
  };

  const getRecommendationIcon = (recommendation?: string) => {
    if (!recommendation) return <Minus className="h-4 w-4" />;
    
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getRecommendationBadge = (recommendation?: string) => {
    if (!recommendation) return null;
    
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      buy: 'default',
      sell: 'destructive',
      hold: 'secondary'
    };

    const labels: Record<string, string> = {
      buy: t('watchlist.buy'),
      sell: t('watchlist.sell'),
      hold: t('watchlist.hold')
    };

    return (
      <Badge variant={variants[recommendation.toLowerCase()] || 'secondary'}>
        {labels[recommendation.toLowerCase()] || recommendation}
      </Badge>
    );
  };

  const getStrengthBadge = (strength?: string) => {
    if (!strength) return null;
    
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      strong: 'default',
      medium: 'secondary',
      weak: 'outline'
    };

    const labels: Record<string, string> = {
      strong: t('watchlist.strong'),
      medium: t('watchlist.medium'),
      weak: t('watchlist.weak')
    };

    return (
      <Badge variant={variants[strength.toLowerCase()] || 'outline'}>
        {labels[strength.toLowerCase()] || strength}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('watchlist.title')}</CardTitle>
              <CardDescription>
                قائمة الأسهم المتابعة مع الأسعار الحية من Twelve Data
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة سهم
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة سهم جديد</DialogTitle>
                    <DialogDescription>
                      أدخل تفاصيل السهم لإضافته إلى قائمة المتابعة
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="symbol">رمز السهم *</Label>
                      <Input
                        id="symbol"
                        placeholder="مثال: AAPL"
                        value={newStock.symbol}
                        onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">اسم الشركة *</Label>
                      <Input
                        id="name"
                        placeholder="مثال: Apple Inc."
                        value={newStock.name}
                        onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="market">السوق</Label>
                      <Select value={newStock.market} onValueChange={(value) => setNewStock({ ...newStock, market: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="US">US (الولايات المتحدة)</SelectItem>
                          <SelectItem value="Turkey">Turkey (تركيا)</SelectItem>
                          <SelectItem value="Crypto">Crypto (عملات رقمية)</SelectItem>
                          <SelectItem value="Commodities">Commodities (سلع)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">النوع</Label>
                      <Select value={newStock.type} onValueChange={(value) => setNewStock({ ...newStock, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Stock">Stock (سهم)</SelectItem>
                          <SelectItem value="Currency Pair">Currency Pair (زوج عملات)</SelectItem>
                          <SelectItem value="Commodity">Commodity (سلعة)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={addStock}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                onClick={updatePrices}
                disabled={refreshing}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                تحديث الأسعار
              </Button>
              <Button
                onClick={analyzeAll}
                disabled={autoAnalyzing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${autoAnalyzing ? 'animate-spin' : ''}`} />
                {autoAnalyzing ? t('watchlist.analyzing') : t('watchlist.autoAnalyze')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!import.meta.env.VITE_GEMINI_API_KEY && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  تحذير: مفتاح Gemini API غير موجود
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  يرجى إضافة VITE_GEMINI_API_KEY في ملف .env لتفعيل التحليل
                </p>
              </div>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('watchlist.symbol')}</TableHead>
                <TableHead>{t('watchlist.name')}</TableHead>
                <TableHead>السعر الحالي</TableHead>
                <TableHead>التغيير اليومي</TableHead>
                <TableHead>نسبة التغيير</TableHead>
                <TableHead>{t('watchlist.market')}</TableHead>
                <TableHead>{t('watchlist.recommendation')}</TableHead>
                <TableHead>{t('watchlist.strength')}</TableHead>
                <TableHead>حالة البيانات</TableHead>
                <TableHead>آخر تحديث</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchlist.map((stock) => {
                const dataStatus = getDataStatus(stock.last_update);
                return (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRecommendationIcon(stock.last_analysis?.recommendation)}
                        {stock.symbol}
                      </div>
                    </TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell className="font-semibold">
                      {stock.current_price ? `$${stock.current_price.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {stock.price_change !== undefined ? (
                        <span className={stock.price_change >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {stock.price_change >= 0 ? '+' : ''}{stock.price_change.toFixed(2)}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {stock.price_change_percent !== undefined ? (
                        <Badge variant={stock.price_change_percent >= 0 ? 'default' : 'destructive'}>
                          {stock.price_change_percent >= 0 ? '+' : ''}{stock.price_change_percent.toFixed(2)}%
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{stock.market}</Badge>
                    </TableCell>
                    <TableCell>
                      {getRecommendationBadge(stock.last_analysis?.recommendation)}
                    </TableCell>
                    <TableCell>
                      {getStrengthBadge(stock.last_analysis?.strength)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{dataStatus.icon}</span>
                        <span className={`text-sm ${dataStatus.color}`}>
                          {dataStatus.text}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {stock.last_update
                          ? new Date(stock.last_update).toLocaleString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => analyzeStock(stock)}
                          disabled={analyzing === stock.symbol || !import.meta.env.VITE_GEMINI_API_KEY}
                        >
                          {analyzing === stock.symbol ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'تحليل'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStock(stock.symbol)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}