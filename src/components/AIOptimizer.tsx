import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Settings, CheckCircle2 } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { ImprovementSuggestion } from '@/types/trading';
import { toast } from 'sonner';

export default function AIOptimizer() {
  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSignals: 0,
    correctSignals: 0,
    avgAccuracy: 0,
    commonMistakes: [] as string[]
  });

  useEffect(() => {
    // محاكاة بيانات إحصائية
    setStats({
      totalSignals: 50,
      correctSignals: 35,
      avgAccuracy: 72.5,
      commonMistakes: [
        'تجاهل مؤشر ADX عند القيم المنخفضة',
        'الدخول المبكر قبل تأكيد MACD',
        'عدم مراعاة حجم التداول'
      ]
    });
  }, []);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const result = await aiService.suggestImprovements(stats);

      if (result.success && result.data) {
        const newSuggestions: ImprovementSuggestion[] = result.data.recommendations.map((rec: string, index: number) => ({
          id: `${Date.now()}-${index}`,
          category: index % 3 === 0 ? 'indicator' : index % 3 === 1 ? 'strategy' : 'risk_management',
          title: rec.split(':')[0] || rec,
          description: rec,
          impact: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
          implemented: false,
          createdAt: new Date()
        }));

        setSuggestions(newSuggestions);
        toast.success('تم توليد اقتراحات التحسين');
      } else {
        toast.error('فشل توليد الاقتراحات');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء توليد الاقتراحات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const implementSuggestion = (id: string) => {
    setSuggestions(suggestions.map(s => 
      s.id === id ? { ...s, implemented: true } : s
    ));
    toast.success('تم تطبيق الاقتراح');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'indicator': return <TrendingUp className="h-4 w-4" />;
      case 'strategy': return <Lightbulb className="h-4 w-4" />;
      case 'risk_management': return <Settings className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'indicator': return 'المؤشرات الفنية';
      case 'strategy': return 'الاستراتيجية';
      case 'risk_management': return 'إدارة المخاطر';
      default: return 'عام';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'high': return 'تأثير عالي';
      case 'medium': return 'تأثير متوسط';
      case 'low': return 'تأثير منخفض';
      default: return 'غير محدد';
    }
  };

  const successRate = stats.totalSignals > 0 ? (stats.correctSignals / stats.totalSignals) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">معدل النجاح الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.correctSignals} من {stats.totalSignals} إشارات صحيحة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">متوسط الدقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              عبر جميع الإشارات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">الاقتراحات المطبقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suggestions.filter(s => s.implemented).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              من {suggestions.length} اقتراحات
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            الأخطاء الشائعة
          </CardTitle>
          <CardDescription>
            الأخطاء الأكثر تكراراً في التحليلات السابقة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.commonMistakes.map((mistake, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm">{mistake}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>اقتراحات التحسين</CardTitle>
              <CardDescription>
                توصيات مدعومة بالذكاء الاصطناعي لتحسين دقة التحليل
              </CardDescription>
            </div>
            <Button onClick={generateSuggestions} disabled={loading}>
              {loading ? 'جاري التوليد...' : 'توليد اقتراحات جديدة'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>اضغط على "توليد اقتراحات جديدة" للحصول على توصيات مخصصة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.id} className={suggestion.implemented ? 'border-green-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(suggestion.category)}
                          <Badge variant="outline">
                            {getCategoryText(suggestion.category)}
                          </Badge>
                          <Badge className={getImpactColor(suggestion.impact)}>
                            {getImpactText(suggestion.impact)}
                          </Badge>
                          {suggestion.implemented && (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="ml-1 h-3 w-3" />
                              مطبق
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      </div>
                      {!suggestion.implemented && (
                        <Button
                          size="sm"
                          onClick={() => implementSuggestion(suggestion.id)}
                        >
                          تطبيق
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المعايير المقترحة للمؤشرات</CardTitle>
          <CardDescription>
            قيم محسّنة للمؤشرات الفنية بناءً على الأداء التاريخي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-semibold mb-2">RSI</div>
              <div className="text-sm space-y-1">
                <div>شراء: &lt; 35 (بدلاً من 30)</div>
                <div>بيع: &gt; 65 (بدلاً من 70)</div>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-semibold mb-2">ADX</div>
              <div className="text-sm space-y-1">
                <div>الحد الأدنى: &gt; 25</div>
                <div>قوة الاتجاه: &gt; 40</div>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="font-semibold mb-2">MACD</div>
              <div className="text-sm space-y-1">
                <div>انتظار تأكيد لمدة 2 شموع</div>
                <div>مراعاة الهستوجرام</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}