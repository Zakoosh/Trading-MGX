import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a mock client if Supabase is not configured
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase is not configured. Using mock client.');
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

// User Portfolio Type
export interface UserPortfolio {
  user_id: string;
  total_value: number;
  cash: number;
  invested_amount: number;
  total_pl: number;
  total_pl_percent: number;
  created_at: string;
  updated_at: string;
}

// User Trade Type
export interface UserTrade {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  entry_price: number;
  current_price: number;
  quantity: number;
  profit: number;
  profit_percent: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Save or update user portfolio
export async function saveUserPortfolio(userId: string, portfolio: Partial<UserPortfolio>) {
  if (!supabase) {
    console.warn('Supabase not configured. Portfolio not saved.');
    return null;
  }

  const { data, error } = await supabase
    .from('portfolios')
    .upsert({
      user_id: userId,
      ...portfolio,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user portfolio
export async function getUserPortfolio(userId: string): Promise<UserPortfolio | null> {
  if (!supabase) {
    console.warn('Supabase not configured. Returning null portfolio.');
    return null;
  }

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Save user trade
export async function saveUserTrade(userId: string, trade: Omit<UserTrade, 'id' | 'user_id'>) {
  if (!supabase) {
    console.warn('Supabase not configured. Trade not saved.');
    return null;
  }

  const { data, error } = await supabase
    .from('trades')
    .insert({
      user_id: userId,
      ...trade
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get user trades
export async function getUserTrades(userId: string): Promise<UserTrade[]> {
  if (!supabase) {
    console.warn('Supabase not configured. Returning empty trades.');
    return [];
  }

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', userId)
    .order('opened_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Update trade
export async function updateUserTrade(tradeId: string, updates: Partial<UserTrade>) {
  if (!supabase) {
    console.warn('Supabase not configured. Trade not updated.');
    return null;
  }

  const { data, error } = await supabase
    .from('trades')
    .update(updates)
    .eq('id', tradeId)
    .select()
    .single();

  if (error) throw error;
  return data;
}