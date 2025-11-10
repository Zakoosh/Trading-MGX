// Alpaca Trading API Service

interface AlpacaConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  portfolio_value: string;
  buying_power: string;
  equity: string;
  last_equity: string;
  multiplier: string;
  initial_margin: string;
  maintenance_margin: string;
  daytrade_count: number;
  daytrading_buying_power: string;
}

interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional: string | null;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_class: string;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: AlpacaOrder[] | null;
  trail_percent: string | null;
  trail_price: string | null;
  hwm: string | null;
}

class AlpacaService {
  private config: AlpacaConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_ALPACA_API_KEY || '',
      secretKey: import.meta.env.VITE_ALPACA_SECRET_KEY || '',
      baseUrl: import.meta.env.VITE_ALPACA_BASE_URL || 'https://paper-api.alpaca.markets'
    };
  }

  private getHeaders(): HeadersInit {
    return {
      'APCA-API-KEY-ID': this.config.apiKey,
      'APCA-API-SECRET-KEY': this.config.secretKey,
      'Content-Type': 'application/json'
    };
  }

  // Get account information
  async getAccount(): Promise<AlpacaAccount> {
    const response = await fetch(`${this.config.baseUrl}/v2/account`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get all positions
  async getPositions(): Promise<AlpacaPosition[]> {
    const response = await fetch(`${this.config.baseUrl}/v2/positions`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get specific position
  async getPosition(symbol: string): Promise<AlpacaPosition> {
    const response = await fetch(`${this.config.baseUrl}/v2/positions/${symbol}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Place an order
  async placeOrder(params: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
  }): Promise<AlpacaOrder> {
    const response = await fetch(`${this.config.baseUrl}/v2/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Alpaca API error: ${error.message || response.statusText}`);
    }

    return await response.json();
  }

  // Get all orders
  async getOrders(params?: {
    status?: 'open' | 'closed' | 'all';
    limit?: number;
    after?: string;
    until?: string;
    direction?: 'asc' | 'desc';
  }): Promise<AlpacaOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.after) queryParams.append('after', params.after);
    if (params?.until) queryParams.append('until', params.until);
    if (params?.direction) queryParams.append('direction', params.direction);

    const response = await fetch(
      `${this.config.baseUrl}/v2/orders?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get specific order
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    const response = await fetch(`${this.config.baseUrl}/v2/orders/${orderId}`, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Cancel an order
  async cancelOrder(orderId: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }
  }

  // Cancel all orders
  async cancelAllOrders(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/v2/orders`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }
  }

  // Close a position
  async closePosition(symbol: string, qty?: number): Promise<AlpacaOrder> {
    const url = qty
      ? `${this.config.baseUrl}/v2/positions/${symbol}?qty=${qty}`
      : `${this.config.baseUrl}/v2/positions/${symbol}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Close all positions
  async closeAllPositions(): Promise<AlpacaOrder[]> {
    const response = await fetch(`${this.config.baseUrl}/v2/positions`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Get latest quote for a symbol
  async getLatestQuote(symbol: string): Promise<{
    symbol: string;
    bid: number;
    ask: number;
    bidSize: number;
    askSize: number;
    timestamp: string;
  }> {
    const response = await fetch(
      `https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`,
      {
        method: 'GET',
        headers: this.getHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(`Alpaca API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      symbol: data.symbol,
      bid: data.quote.bp,
      ask: data.quote.ap,
      bidSize: data.quote.bs,
      askSize: data.quote.as,
      timestamp: data.quote.t
    };
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccount();
      return true;
    } catch (error) {
      console.error('Alpaca connection test failed:', error);
      return false;
    }
  }

  // Check if API keys are configured
  isConfigured(): boolean {
    return !!(this.config.apiKey && this.config.secretKey);
  }
}

export const alpacaService = new AlpacaService();
export type { AlpacaAccount, AlpacaPosition, AlpacaOrder };