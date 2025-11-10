import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Globe, LogOut, Wallet, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AIAnalyzer from '@/components/AIAnalyzer';
import AIEvaluator from '@/components/AIEvaluator';
import AISimulator from '@/components/AISimulator';
import AIOptimizer from '@/components/AIOptimizer';
import RealTrading from '@/components/RealTrading';
import Reports from '@/components/Reports';
import AdminDashboard from '@/components/AdminDashboard';
import Watchlist from '@/components/Watchlist';
import { supabase, isSupabaseConfigured, getUserPortfolio } from '@/lib/supabase';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'zalbeltaji@gmail.com';

export default function Index() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [portfolio, setPortfolio] = useState<{ totalValue: number; cash: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabaseEnabled = isSupabaseConfigured();

  useEffect(() => {
    if (supabaseEnabled) {
      loadPortfolio();
      checkAdminStatus();
    }
  }, [supabaseEnabled]);

  const checkAdminStatus = async () => {
    if (!supabase) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === ADMIN_EMAIL);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadPortfolio = async () => {
    if (!supabase) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const portfolioData = await getUserPortfolio(user.id);
        if (portfolioData) {
          setPortfolio({
            totalValue: portfolioData.total_value,
            cash: portfolioData.cash
          });
        }
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    
    try {
      await supabase.auth.signOut();
      toast.success(t('dashboard.signedOut'));
    } catch (error) {
      toast.error(t('dashboard.signOutError'));
    }
  };

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('dashboard.appName')}
              </h1>
              {isAdmin && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Shield className="h-4 w-4 text-white" />
                  <span className="text-xs font-semibold text-white">مدير</span>
                </div>
              )}
              {portfolio && (
                <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    ${portfolio.totalValue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Globe className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('ar')}>
                    🇸🇦 العربية
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')}>
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('tr')}>
                    🇹🇷 Türkçe
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>

              {/* Sign Out (only if Supabase is enabled) */}
              {supabaseEnabled && (
                <Button variant="outline" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-8' : 'grid-cols-7'} mb-8`}>
            <TabsTrigger value="watchlist">{t('tabs.watchlist')}</TabsTrigger>
            <TabsTrigger value="analyzer">{t('tabs.aiAnalyzer')}</TabsTrigger>
            <TabsTrigger value="evaluator">{t('tabs.aiEvaluator')}</TabsTrigger>
            <TabsTrigger value="simulator">{t('tabs.aiSimulator')}</TabsTrigger>
            <TabsTrigger value="optimizer">{t('tabs.aiOptimizer')}</TabsTrigger>
            <TabsTrigger value="trading">{t('tabs.realTrading')}</TabsTrigger>
            <TabsTrigger value="reports">{t('tabs.reports')}</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin">{t('tabs.admin')}</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="watchlist">
            <Watchlist />
          </TabsContent>

          <TabsContent value="analyzer">
            <AIAnalyzer />
          </TabsContent>

          <TabsContent value="evaluator">
            <AIEvaluator />
          </TabsContent>

          <TabsContent value="simulator">
            <AISimulator />
          </TabsContent>

          <TabsContent value="optimizer">
            <AIOptimizer />
          </TabsContent>

          <TabsContent value="trading">
            <RealTrading />
          </TabsContent>

          <TabsContent value="reports">
            <Reports />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          {t('dashboard.footer')}
        </div>
      </footer>
    </div>
  );
}