# Investing2 - Setup Guide

## 🚀 Quick Start

### 1. Supabase Setup (Required for Authentication & Data Storage)

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

#### Database Setup
Run this SQL in Supabase SQL Editor:

```sql
-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_value DECIMAL(15,2) DEFAULT 10000,
  cash DECIMAL(15,2) DEFAULT 10000,
  invested_amount DECIMAL(15,2) DEFAULT 0,
  total_pl DECIMAL(15,2) DEFAULT 0,
  total_pl_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('buy', 'sell')),
  entry_price DECIMAL(10,2) NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  profit DECIMAL(10,2) DEFAULT 0,
  profit_percent DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(10) NOT NULL CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- Portfolios policies
CREATE POLICY "Users can view own portfolio" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolio" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portfolio" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trades policies
CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_opened_at ON trades(opened_at DESC);
```

#### Enable Authentication Providers
1. Go to Authentication > Providers in Supabase Dashboard
2. Enable:
   - **Email** (already enabled by default)
   - **Google**: Add OAuth credentials
   - **Apple**: Add OAuth credentials
   - **Phone**: Configure Twilio or other SMS provider

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
```env
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI APIs (At least one required)
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENAI_API_KEY=your-openai-key

# Optional
VITE_TWELVE_DATA_API_KEY=your-twelve-data-key
VITE_TELEGRAM_BOT_TOKEN=your-telegram-token
VITE_TELEGRAM_CHAT_ID=your-chat-id
```

### 3. Install & Run

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build
```

## 🌍 Features

### Multi-Language Support
- 🇸🇦 Arabic (العربية)
- 🇺🇸 English
- 🇹🇷 Turkish (Türkçe)

### Theme Support
- 🌞 Light Mode
- 🌙 Dark Mode

### Authentication Methods
- 📧 Email/Password
- 📱 Phone (SMS OTP)
- 🔵 Google OAuth
- 🍎 Apple OAuth

### Core Features
1. **AI Analyzer**: Stock analysis with AI
2. **AI Evaluator**: Signal accuracy evaluation
3. **AI Simulator**: Trading simulation
4. **AI Optimizer**: Performance improvement suggestions
5. **Real Trading**: Live trading integration (in development)
6. **Reports**: Daily and weekly reports

## 📊 Data Persistence

All user data is stored in Supabase:
- User portfolios
- Trading history
- Performance metrics
- Personal settings

## 🔒 Security

- Row Level Security (RLS) enabled
- User data isolation
- Secure authentication
- API key protection

## 🆘 Troubleshooting

### "OpenAI API error"
- Check if `VITE_OPENAI_API_KEY` is set correctly
- Verify API key has sufficient credits
- System will automatically fallback to Gemini if available

### Authentication Issues
- Verify Supabase URL and keys
- Check if authentication providers are enabled
- Ensure database tables are created

### Build Errors
- Run `pnpm install` to ensure all dependencies are installed
- Clear cache: `rm -rf node_modules .vite && pnpm install`

## 📝 Notes

- Initial portfolio value: $10,000
- All trades are simulated by default
- Real trading requires broker API integration
- Telegram notifications are optional

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Gemini API](https://ai.google.dev/)
- [OpenAI API](https://platform.openai.com/)
- [Twelve Data API](https://twelvedata.com/)

## 📧 Support

For issues or questions, please check the documentation or contact support.