import sqlite3
from pathlib import Path
import json

DB = Path("bot.db")

def _conn():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = _conn()
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS trades(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        symbol TEXT, side TEXT, qty INTEGER, price REAL, note TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS state(
        key TEXT PRIMARY KEY, val TEXT
    )""")
    # defaults
    c.execute("INSERT OR IGNORE INTO state(key,val) VALUES('kill_switch','0')")
    c.execute("INSERT OR IGNORE INTO state(key,val) VALUES('watchlist','[\"AAPL\",\"TSLA\"]')")
    conn.commit(); conn.close()

def get_exposure_value():
    conn = _conn(); c = conn.cursor()
    c.execute("SELECT SUM(qty*price) FROM trades WHERE side='buy'")
    val = c.fetchone()[0]
    conn.close()
    return float(val or 0.0)

def log_trade(symbol, side, qty, price, note=""):
    conn = _conn(); c = conn.cursor()
    c.execute("INSERT INTO trades(symbol,side,qty,price,note) VALUES (?,?,?,?,?)",
              (symbol, side, int(qty), float(price), note))
    conn.commit(); conn.close()

def get_recent_trades(limit: int = 100) -> list[dict]:
    """
    يرجّع أحدث الصفقات مرتبة تنازليًا حسب تاريخ الإدراج.
    """
    limit = max(1, min(int(limit), 500))
    conn = _conn()
    rows = conn.execute(
        "SELECT ts, symbol, side, qty, price, note FROM trades ORDER BY id DESC LIMIT ?",
        (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ===== state / kill switch =====
def get_state(key: str, default: str = "") -> str:
    conn = _conn(); c = conn.cursor()
    c.execute("SELECT val FROM state WHERE key=?", (key,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else default

def set_state(key: str, val: str):
    conn = _conn(); c = conn.cursor()
    c.execute("INSERT INTO state(key,val) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET val=excluded.val", (key, val))
    conn.commit(); conn.close()

def is_kill_switch_on() -> bool:
    return get_state("kill_switch","0") == "1"

def toggle_kill_switch() -> bool:
    newv = "0" if is_kill_switch_on() else "1"
    set_state("kill_switch", newv)
    return newv == "1"

# ===== open positions & pnl =====
def get_open_positions():
    """
    يرجّع [{'symbol': 'AAPL', 'net_qty': 12, 'avg_cost': 98.5}] للرموز ذات كمية صافية موجبة.
    """
    conn = _conn(); c = conn.cursor()
    # صافي الكمية
    c.execute("""
      SELECT symbol,
             SUM(CASE WHEN side='buy' THEN qty ELSE -qty END) as net_qty
      FROM trades
      GROUP BY symbol
      HAVING net_qty > 0
    """)
    rows = c.fetchall()
    result = []
    for sym, net_qty in rows:
        # متوسط تكلفة للشراء فقط (وزني)
        cur = conn.cursor()
        cur.execute("SELECT qty, price FROM trades WHERE symbol=? AND side='buy'", (sym,))
        buys = cur.fetchall()
        cost_val = sum(q*qprice for q, qprice in buys)
        qty_sum = sum(q for q, _ in buys)
        avg_cost = (cost_val / qty_sum) if qty_sum else 0.0
        result.append({"symbol": sym, "net_qty": int(net_qty), "avg_cost": float(avg_cost)})
    conn.close()
    return result

def sum_buys_sells():
    conn = _conn(); c = conn.cursor()
    c.execute("SELECT COALESCE(SUM(qty*price),0) FROM trades WHERE side='buy'")
    buys = c.fetchone()[0]
    c.execute("SELECT COALESCE(SUM(qty*price),0) FROM trades WHERE side='sell'")
    sells = c.fetchone()[0]
    conn.close()
    return float(buys), float(sells)

# ===== watchlist =====
def get_watchlist() -> list[str]:
    raw = get_state("watchlist", "[]")
    try: return json.loads(raw)
    except: return []

def set_watchlist(symbols: list[str]):
    set_state("watchlist", json.dumps(symbols))
