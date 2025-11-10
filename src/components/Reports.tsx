import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Download, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { DailyReport, WeeklyReport } from '@/types/trading';
import { toast } from 'sonner';

export default function Reports() {
  const [dailyReports] = useState<DailyReport[]>([
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      signals: [],
      evaluations: [],
      trades: [],
      metrics: {
        date: new Date().toISOString().split('T')[0],
        totalSignals: 12,
        correctSignals: 9,
        accuracy: 75,
        totalTrades: 8,
        winningTrades: 6,
        losingTrades: 2,
        winRate: 75,
        totalProfit: 1250,
        averageProfit: 156.25,
        bestTrade: null,
        worstTrade: null
      },
      improvements: [],
      summary: 'يوم تداول ناجح مع معدل نجاح 75%. تم تحقيق أرباح جيدة في قطاع التكنولوجيا.',
      createdAt: new Date()
    }
  ]);

  const [weeklyReports] = useState<WeeklyReport[]>([
    {
      id: '1',
      weekStart: '2024-01-01',
      weekEnd: '2024-01-07',
      dailyReports: [],
      totalSignals: 60,
      averageAccuracy: 72.5,
      totalProfit: 5800,
      winRate: 68,
      topPerformers: [
        { symbol: 'AAPL', name: 'Apple', price: 185.5, change: 12.5, changePercent: 7.2 },
        { symbol: 'MSFT', name: 'Microsoft', price: 380.2, change: 18.3, changePercent: 5.1 }
      ],
      worstPerformers: [
        { symbol: 'TSLA', name: 'Tesla', price: 242.8, change: -15.2, changePercent: -5.9 }
      ],
      keyInsights: [
        'أداء قوي في قطاع التكنولوجيا',
        'تحسن ملحوظ في دقة إشارات RSI',
        'يُنصح بزيادة التركيز على الأسهم ذات الحجم العالي'
      ],
      createdAt: new Date()
    }
  ]);

  const downloadReport = (type: 'daily' | 'weekly', reportId: string) => {
    toast.success(`جاري تحميل التقرير ${type === 'daily' ? 'اليومي' : 'الأسبوعي'}...`);
    // هنا سيتم تنفيذ منطق التحميل الفعلي
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              التقارير اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dailyReports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              تقرير متاح
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              التقارير الأسبوعية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyReports.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              تقرير متاح
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              الأداء العام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+72.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              متوسط الدقة
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="daily">التقارير اليومية</TabsTrigger>
          <TabsTrigger value="weekly">التقارير الأسبوعية</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4 mt-4">
          {dailyReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>تقرير يوم {new Date(report.date).toLocaleDateString('ar-SA')}</CardTitle>
                    <CardDescription>
                      تم الإنشاء في {new Date(report.createdAt).toLocaleString('ar-SA')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport('daily', report.id)}
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تحميل PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">إجمالي الإشارات</div>
                    <div className="text-2xl font-bold">{report.metrics.totalSignals}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">الدقة</div>
                    <div className="text-2xl font-bold text-green-600">{report.metrics.accuracy}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">معدل النجاح</div>
                    <div className="text-2xl font-bold text-blue-600">{report.metrics.winRate}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">الربح الإجمالي</div>
                    <div className="text-2xl font-bold text-green-600">${report.metrics.totalProfit}</div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">ملخص اليوم</h4>
                  <p className="text-sm text-muted-foreground">{report.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">الصفقات</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>صفقات رابحة</span>
                        <Badge className="bg-green-500">{report.metrics.winningTrades}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>صفقات خاسرة</span>
                        <Badge className="bg-red-500">{report.metrics.losingTrades}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>متوسط الربح</span>
                        <Badge variant="outline">${report.metrics.averageProfit.toFixed(2)}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">الإشارات</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>إشارات صحيحة</span>
                        <Badge className="bg-green-500">{report.metrics.correctSignals}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>إشارات خاطئة</span>
                        <Badge className="bg-red-500">{report.metrics.totalSignals - report.metrics.correctSignals}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>نسبة الدقة</span>
                        <Badge variant="outline">{report.metrics.accuracy}%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4 mt-4">
          {weeklyReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      تقرير الأسبوع: {new Date(report.weekStart).toLocaleDateString('ar-SA')} - {new Date(report.weekEnd).toLocaleDateString('ar-SA')}
                    </CardTitle>
                    <CardDescription>
                      تم الإنشاء في {new Date(report.createdAt).toLocaleString('ar-SA')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport('weekly', report.id)}
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تحميل PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">إجمالي الإشارات</div>
                    <div className="text-2xl font-bold">{report.totalSignals}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">متوسط الدقة</div>
                    <div className="text-2xl font-bold text-green-600">{report.averageAccuracy}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">معدل النجاح</div>
                    <div className="text-2xl font-bold text-blue-600">{report.winRate}%</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">الربح الإجمالي</div>
                    <div className="text-2xl font-bold text-green-600">${report.totalProfit}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        الأسهم الأفضل أداءً
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.topPerformers.map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <div className="font-semibold">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground">{stock.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">+{stock.changePercent}%</div>
                              <div className="text-xs text-muted-foreground">${stock.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        الأسهم الأسوأ أداءً
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.worstPerformers.map((stock) => (
                          <div key={stock.symbol} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <div className="font-semibold">{stock.symbol}</div>
                              <div className="text-xs text-muted-foreground">{stock.name}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-red-600">{stock.changePercent}%</div>
                              <div className="text-xs text-muted-foreground">${stock.price}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">الرؤى الرئيسية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.keyInsights.map((insight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                            {index + 1}
                          </div>
                          <span className="text-sm">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}