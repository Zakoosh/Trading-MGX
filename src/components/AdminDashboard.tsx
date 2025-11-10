import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Users, Settings, Key, List, AlertCircle } from 'lucide-react';

const ADMIN_EMAIL = 'zalbeltaji@gmail.com';

interface User {
  id: string;
  email: string;
  created_at: string;
  can_use_admin_keys: boolean;
  has_own_keys: boolean;
}

interface SystemSettings {
  auto_analysis_enabled: boolean;
  analysis_interval: number;
  notifications_enabled: boolean;
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    auto_analysis_enabled: false,
    analysis_interval: 60,
    notifications_enabled: true
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
    loadUsers();
    loadSettings();
  }, []);

  const checkAdminStatus = async () => {
    if (!supabase) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === ADMIN_EMAIL);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast.error(`فشل تحميل المستخدمين: ${error.message}`);
        return;
      }
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('فشل تحميل المستخدمين');
    }
  };

  const loadSettings = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }
      
      if (data) {
        setSettings({
          auto_analysis_enabled: data.auto_analysis_enabled,
          analysis_interval: data.analysis_interval,
          notifications_enabled: data.notifications_enabled
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleUserApiAccess = async (userId: string, currentStatus: boolean) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ can_use_admin_keys: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user access:', error);
        toast.error(`فشل تحديث الصلاحيات: ${error.message}`);
        return;
      }
      
      toast.success('✅ تم تحديث صلاحيات المستخدم');
      loadUsers();
    } catch (error) {
      console.error('Error updating user access:', error);
      toast.error('فشل تحديث الصلاحيات');
    }
  };

  const updateSystemSettings = async () => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1,
          auto_analysis_enabled: settings.auto_analysis_enabled,
          analysis_interval: settings.analysis_interval,
          notifications_enabled: settings.notifications_enabled,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating settings:', error);
        toast.error(`فشل حفظ الإعدادات: ${error.message}`);
        return;
      }
      
      toast.success('✅ تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('فشل حفظ الإعدادات');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>غير مصرح</CardTitle>
          <CardDescription>
            هذه الصفحة متاحة فقط للمدير (zalbeltaji@gmail.com)
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{t('admin.title')}</h2>
        <p className="text-muted-foreground mt-2">
          إدارة المستخدمين والإعدادات ومفاتيح API
        </p>
      </div>

      {!supabase && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              تحذير: Supabase غير متصل
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              يرجى تفعيل Supabase وتشغيل SQL script لاستخدام لوحة الإدارة
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {t('admin.users')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            {t('admin.settings')}
          </TabsTrigger>
          <TabsTrigger value="apikeys">
            <Key className="h-4 w-4 mr-2" />
            {t('admin.apiKeys')}
          </TabsTrigger>
          <TabsTrigger value="watchlist">
            <List className="h-4 w-4 mr-2" />
            {t('admin.watchlist')}
          </TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>
                التحكم في صلاحيات المستخدمين واستخدام مفاتيح API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا يوجد مستخدمين مسجلين بعد
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>استخدام مفاتيح المدير</TableHead>
                      <TableHead>لديه مفاتيح خاصة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.can_use_admin_keys ? 'default' : 'secondary'}>
                            {user.can_use_admin_keys ? 'مفعّل' : 'معطّل'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.has_own_keys ? 'default' : 'secondary'}>
                            {user.has_own_keys ? 'نعم' : 'لا'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserApiAccess(user.id, user.can_use_admin_keys)}
                          >
                            {user.can_use_admin_keys ? 'إلغاء الصلاحية' : 'منح الصلاحية'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات النظام</CardTitle>
              <CardDescription>
                التحكم في إعدادات التحليل التلقائي والإشعارات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>التحليل التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل التحليل التلقائي لقائمة المتابعة
                  </p>
                </div>
                <Switch
                  checked={settings.auto_analysis_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, auto_analysis_enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>فترة التحليل (بالدقائق)</Label>
                <Input
                  type="number"
                  value={settings.analysis_interval}
                  onChange={(e) =>
                    setSettings({ ...settings, analysis_interval: parseInt(e.target.value) || 60 })
                  }
                  min={15}
                  max={1440}
                />
                <p className="text-sm text-muted-foreground">
                  المدة بين كل تحليل تلقائي (15-1440 دقيقة)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">
                    إرسال إشعارات Telegram عند الإشارات القوية
                  </p>
                </div>
                <Switch
                  checked={settings.notifications_enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, notifications_enabled: checked })
                  }
                />
              </div>

              <Button onClick={updateSystemSettings} className="w-full" disabled={!supabase}>
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <CardTitle>مفاتيح API</CardTitle>
              <CardDescription>
                إدارة مفاتيح API للنظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>مفتاح Gemini API</Label>
                <Input
                  type="password"
                  placeholder="أدخل مفتاح Gemini"
                  value={import.meta.env.VITE_GEMINI_API_KEY || ''}
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  {import.meta.env.VITE_GEMINI_API_KEY ? '✅ مفعّل' : '❌ غير موجود'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>مفتاح Alpaca API</Label>
                <Input
                  type="password"
                  placeholder="أدخل مفتاح Alpaca"
                  value={import.meta.env.VITE_ALPACA_API_KEY || ''}
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  {import.meta.env.VITE_ALPACA_API_KEY ? '✅ مفعّل' : '❌ غير موجود'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>سر Alpaca API</Label>
                <Input
                  type="password"
                  placeholder="أدخل سر Alpaca"
                  value={import.meta.env.VITE_ALPACA_SECRET_KEY || ''}
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  {import.meta.env.VITE_ALPACA_SECRET_KEY ? '✅ مفعّل' : '❌ غير موجود'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>رمز Telegram Bot</Label>
                <Input
                  type="password"
                  placeholder="أدخل رمز Telegram"
                  value={import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''}
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  {import.meta.env.VITE_TELEGRAM_BOT_TOKEN ? '✅ مفعّل' : '❌ غير موجود'}
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 لتحديث المفاتيح، قم بتعديل ملف .env وإعادة تشغيل التطبيق
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Watchlist */}
        <TabsContent value="watchlist">
          <Card>
            <CardHeader>
              <CardTitle>قائمة المتابعة</CardTitle>
              <CardDescription>
                الأسهم التي يتم تحليلها تلقائياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                سيتم عرض قائمة المتابعة في التبويب المخصص
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.location.hash = '#watchlist'}>
                انتقل إلى قائمة المتابعة
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}