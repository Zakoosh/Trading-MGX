import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Lock, Unlock, Activity, RefreshCw, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RealTradingConfig, Signal, SignalEvaluation } from '@/types/trading';
import { alpacaService, AlpacaAccount, AlpacaPosition } from '@/services/alpacaService';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/dateFormatter';

interface SignalWithEvaluation {
  signal: Signal;
  evaluation: SignalEvaluation;
}

const DEFAULT_CONFIG: RealTradingConfig = {
  enabled: false,
  broker: 'alpaca',
  apiKey: '',
  apiSecret: '',
  initialCapital: 10000,
  maxPositionSize: 1000,
  maxDailyLoss: 500,
  minConfidenceThreshold: 75
};

export default function RealTrading() {
  const [config, setConfig] = useState<RealTradingConfig>(DEFAULT_CONFIG);
  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pendingSignals, setPendingSignals] = useState<SignalWithEvaluation[]>([]);
  const [autoTrading, setAutoTrading] = useState(false);

  // تحميل الإعدادات من localStorage عند بدء التشغيل
  useEffect(() => {
    const savedConfig = localStorage.getItem('real_trading_config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }
  }, []);

  // حفظ الإعدادات في localStorage عند كل تغيير
  useEffect(() => {
    localStorage.setItem('real_trading_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    checkConnection();
  }, []);

  // تحميل الإشارات من المقيم الذكي
  useEffect(() => {
    const loadSignals = () => {
      const savedSignals = localStorage.getItem('signals_for_real_trading');
      if (savedSignals) {
        try {
          const signalsList = JSON.parse(savedSignals);
          if (Array.isArray(signalsList) && signalsList.length > 0) {
            setPendingSignals(prev => {
              const existingIds = new Set(prev.map(s => s.signal.id));
              const newSignals = signalsList.filter((s: SignalWithEvaluation) => !existingIds.has(s.signal.id));
              if (newSignals.length > 0) {
                toast.success(`تم استقبال ${newSignals.length} إشارة جديدة للتداول الحقيقي`);
                localStorage.removeItem('signals_for_real_trading');
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

  // تنفيذ تلقائي للإشارات إذا كان التداول مفعلاً
  useEffect(() => {
    if (pendingSignals.length > 0 && config.enabled && connected && !autoTrading) {
      executeAllSignals();
    }
  }, [pendingSignals.length, config.enabled, connected]);

  const checkConnection = async () => {
    if (alpacaService.isConfigured()) {
      const isConnected = await alpacaService.testConnection();
      setConnected(isConnected);
      if (isConnected) {
        loadAccountData();
      }
    }
  };

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const accountData = await alpacaService.getAccount();
      setAccount(accountData);

      const positionsData = await alpacaService.getPositions();
      setPositions(positionsData);

      toast.success('تم تحميل بيانات الحساب');
    } catch (error) {
      toast.error('فشل تحميل بيانات الحساب');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const executeSignalTrade = async (signalData: SignalWithEvaluation) => {
    const { signal } = signalData;
    
    // التحقق من الثقة
    if (signal.confidence < config.minConfidenceThreshold) {
      toast.warning(`تم تجاهل ${signal.symbol} - الثقة أقل من الحد الأدنى`);
      return false;
    }

    // التحقق من حجم الصفقة
    const maxQuantity = Math.floor(config.maxPositionSize / signal.price);
    if (maxQuantity === 0) {
      toast.error(`حجم الصفقة صغير جداً لـ ${signal.symbol}`);
      return false;
    }

    try {
      // تنفيذ الأمر عبر Alpaca
      const side = signal.recommendation === 'buy' ? 'buy' : 'sell';
      const order = await alpacaService.placeOrder({
        symbol: signal.symbol,
        qty: maxQuantity,
        side: side,
        type: 'market',
        time_in_force: 'day'
      });

      if (order) {
        toast.success(`✅ تم تنفيذ صفقة ${signal.symbol} - ${side.toUpperCase()}`);
        
        // تحديث المراكز
        await loadAccountData();
        return true;
      } else {
        toast.error(`فشل تنفيذ صفقة ${signal.symbol}`);
        return false;
      }
    } catch (error) {
      toast.error(`خطأ في تنفيذ صفقة ${signal.symbol}`);
      console.error(error);
      return false;
    }
  };

  const executeAllSignals = async () => {
    if (pendingSignals.length === 0) return;
    if (!config.enabled) {
      toast.warning('التداول الحقيقي غير مفعل');
      return;
    }
    if (!connected) {
      toast.error('غير متصل بـ Alpaca');
      return;
    }

    setAutoTrading(true);
    toast.info(`بدء تنفيذ ${pendingSignals.length} صفقة حقيقية...`);

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
        await new Promise(resolve => setTimeout(resolve, 1000));
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

  const toggleTrading = () => {
    if (!config.enabled) {
      if (!connected) {
        toast.error('الرجاء التحقق من اتصال API أولاً');
        return;
      }
      toast.success('تم تفعيل التداول الحقيقي');
    } else {
      toast.warning('تم إيقاف التداول الحقيقي');
    }
    setConfig({ ...config, enabled: !config.enabled });
  };

  const saveConfig = () => {
    localStorage.setItem('real_trading_config', JSON.stringify(config));
    toast.success('تم حفظ الإعدادات');
  };

  return (
    <div className="space-y-6">
      <Alert variant={connected ? 'default' : 'destructive'}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{connected ? 'متصل بـ Alpaca' : 'تحذير هام'}</AlertTitle>
        <AlertDescription>
          {connected
            ? 'أنت متصل بحساب Alpaca Paper Trading. يمكنك البدء في التداول التجريبي بأمان.'
            : 'التداول الحقيقي ينطوي على مخاطر مالية. تأكد من فهمك الكامل للمخاطر قبل التفعيل.'}
        </AlertDescription>
      </Alert>

      {account && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">قيمة المحفظة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(account.portfolio_value).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">إجمالي الأصول</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">النقد المتاح</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(account.cash).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">السيولة</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">القوة الشرائية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(account.buying_power).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">متاح للتداول</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">المراكز المفتوحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positions.length}</div>
              <p className="text-xs text-muted-foreground mt-1">صفقات نشطة</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {config.enabled ? <Unlock className="h-5 w-5 text-green-500" /> : <Lock className="h-5 w-5" />}
                حالة التداول الحقيقي
              </CardTitle>
              <CardDescription>
                {config.enabled ? 'التداول الحقيقي مفعّل - سيتم تنفيذ الإشارات تلقائياً' : 'التداول الحقيقي متوقف'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={loadAccountData}
                disabled={loading || !connected}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Switch
                checked={config.enabled}
                onCheckedChange={toggleTrading}
                disabled={!connected}
              />
              <Badge variant={config.enabled ? 'default' : 'secondary'}>
                {config.enabled ? 'مفعّل' : 'متوقف'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

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
                  {config.enabled ? 'سيتم تنفيذها تلقائياً' : 'قم بتفعيل التداول لتنفيذها'}
                </CardDescription>
              </div>
              <Button
                onClick={executeAllSignals}
                disabled={autoTrading || !config.enabled || !connected}
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
                  <div className="text-right">
                    <Badge variant="outline">ثقة {signalData.signal.confidence}%</Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      دقة {signalData.evaluation.accuracy}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>المراكز المفتوحة</CardTitle>
            <CardDescription>الصفقات النشطة حالياً</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positions.map((position) => {
                const pl = parseFloat(position.unrealized_pl);
                const plPercent = parseFloat(position.unrealized_plpc) * 100;
                return (
                  <div key={position.symbol} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-semibold">{position.symbol}</div>
                      <div className="text-xs text-muted-foreground">
                        {position.qty} سهم @ ${parseFloat(position.avg_entry_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${parseFloat(position.market_value).toFixed(2)}</div>
                      <div className={`text-xs ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {pl >= 0 ? '+' : ''}${pl.toFixed(2)} ({plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>إعدادات إدارة المخاطر</CardTitle>
          <CardDescription>
            حدد حدود التداول لحماية رأس المال
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>رأس المال الأولي ($)</Label>
              <Input
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({ ...config, initialCapital: parseFloat(e.target.value) })}
                disabled={config.enabled}
                className="mt-1"
              />
            </div>

            <div>
              <Label>الحد الأقصى لحجم الصفقة ($)</Label>
              <Input
                type="number"
                value={config.maxPositionSize}
                onChange={(e) => setConfig({ ...config, maxPositionSize: parseFloat(e.target.value) })}
                disabled={config.enabled}
                className="mt-1"
              />
            </div>

            <div>
              <Label>الحد الأقصى للخسارة اليومية ($)</Label>
              <Input
                type="number"
                value={config.maxDailyLoss}
                onChange={(e) => setConfig({ ...config, maxDailyLoss: parseFloat(e.target.value) })}
                disabled={config.enabled}
                className="mt-1"
              />
            </div>

            <div>
              <Label>الحد الأدنى لثقة الإشارة (%)</Label>
              <Input
                type="number"
                value={config.minConfidenceThreshold}
                onChange={(e) => setConfig({ ...config, minConfidenceThreshold: parseFloat(e.target.value) })}
                disabled={config.enabled}
                className="mt-1"
              />
            </div>
          </div>

          <Button onClick={saveConfig} disabled={config.enabled} className="w-full">
            حفظ الإعدادات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            حالة الاتصال
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>الوسيط</span>
              <Badge variant="default">Alpaca</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>نوع الحساب</span>
              <Badge variant="outline">{account?.status || 'Paper Trading'}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span>حالة الاتصال</span>
              <Badge variant={connected ? 'default' : 'secondary'}>
                {connected ? 'متصل' : 'غير متصل'}
              </Badge>
            </div>
            {account && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>رقم الحساب</span>
                <Badge variant="outline">{account.account_number}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>ملاحظة</AlertTitle>
        <AlertDescription>
          أنت متصل حالياً بحساب Paper Trading (تداول تجريبي). لا توجد أموال حقيقية معرضة للخطر.
          للتداول الحقيقي، يُرجى تحديث إعدادات API للاتصال بحساب Live Trading.
        </AlertDescription>
      </Alert>
    </div>
  );
}