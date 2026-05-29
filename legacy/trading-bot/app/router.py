from fastapi import APIRouter, Header, HTTPException, Form, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, field_validator
from .config import settings
from .risk import within_exposure
from .store import (
    get_exposure_value, log_trade, is_kill_switch_on, toggle_kill_switch,
    get_open_positions, sum_buys_sells, get_watchlist, set_watchlist,
    get_recent_trades
)
from .broker import PaperBroker
from . import notify
from .quotes import get_prices, get_last_price, get_quotes_details
from .ai import decide_from_indicators
import hmac, hashlib, math, sqlite3

router = APIRouter()
broker = PaperBroker()

# ===== نماذج التنفيذ اليدوي/المباشر =====
class Alert(BaseModel):
    symbol: str
    side: str            # "buy" or "sell"
    qty_shares: int
    note: str | None = None
    price: float | None = None

    @field_validator("side")
    def _side_ok(cls, v):
        v = v.lower()
        if v not in ("buy", "sell"):
            raise ValueError("side must be 'buy' or 'sell'")
        return v

    @field_validator("qty_shares")
    def _qty_ok(cls, v):
        if v <= 0: raise ValueError("qty_shares must be > 0")
        return v

def _execute(alert: Alert):
    if is_kill_switch_on() and alert.side == "buy":
        raise HTTPException(status_code=403, detail="Kill Switch ON (شراء معطّل مؤقتًا)")

    price = alert.price or broker.get_last_price(alert.symbol)
    qty = int(alert.qty_shares)
    if qty <= 0 or price <= 0:
        raise HTTPException(status_code=400, detail="Invalid qty/price")

    # حد التعرّض العام غالبًا كبير الآن للتطوير، لكن نترك الفحص قائمًا
    exposure_now = get_exposure_value()
    if alert.side == "buy" and not within_exposure(exposure_now, qty * price):
        raise HTTPException(status_code=400, detail="Exposure limit reached")

    order = broker.submit_order(alert.symbol, alert.side, qty)
    log_trade(alert.symbol, alert.side, qty, price, alert.note or "")

    notify.send(
        f"🤖 تنفيذ آلي\n"
        f"رمز: {alert.symbol}\n"
        f"اتجاه: {alert.side.upper()}\n"
        f"كمية: {qty} سهم\n"
        f"سعر: {price:.2f}\n"
        f"ملاحظة: {alert.note or '-'}"
    )
    return {"status": "ok", "qty": qty, "price": price, "order": order}

# ===== HMAC اختياري =====
def _verify_hmac(sig: str | None, body: bytes) -> bool:
    secret = settings.hmac_secret.encode() if settings.hmac_secret else b""
    if not secret:
        return True
    if not sig:
        return False
    calc = hmac.new(secret, body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(calc, sig)

# ===== Webhook قديم (لو كنتِ تستخدمينه) =====
@router.post("/webhook")
async def webhook(request: Request, alert: Alert, x_hook_secret: str | None = Header(default=None), x_signature: str | None = Header(default=None)):
    if settings.webhook_secret and x_hook_secret != settings.webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")
    body = await request.body()
    if not _verify_hmac(x_signature, body):
        raise HTTPException(status_code=401, detail="Invalid HMAC")
    return _execute(alert)

# ===== Webhook TradingView الجديد =====
class TVPayload(BaseModel):
    symbol: str
    price: float | None = None
    rsi: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    ema_fast: float | None = None
    ema_slow: float | None = None
    trend_strength: float | None = None
    timeframe: str | None = None
    note: str | None = None
    max_trade_amount: float | None = None   # يسمح للإنذار يغيّر سقف الصفقة لهذه الإشارة فقط

@router.post("/webhook-tv")
async def webhook_tv(
    payload: TVPayload,
    request: Request,
    x_hook_secret: str | None = Header(default=None),
    x_signature: str | None = Header(default=None)
):
    # حماية
    if settings.webhook_secret and x_hook_secret != settings.webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid secret")
    body = await request.body()
    if not _verify_hmac(x_signature, body):
        raise HTTPException(status_code=401, detail="Invalid HMAC")

    # قرار أولي
    d = decide_from_indicators(
        rsi=payload.rsi,
        macd=payload.macd,
        macd_signal=payload.macd_signal,
        ema_fast=payload.ema_fast,
        ema_slow=payload.ema_slow,
        trend_strength=payload.trend_strength
    )

    # لو ما في إشارة قوية: لا تنفيذ
    if d.action == "hold":
        notify.send(f"🟡 HOLD {payload.symbol} — {d.reason}")
        return {"ok": True, "action": "hold", "reason": d.reason, "confidence": d.confidence}

    side = d.action  # "buy" / "sell"
    last = payload.price or broker.get_last_price(payload.symbol)
    if not last or last <= 0:
        raise HTTPException(status_code=400, detail="No valid price")

    # احسبي الكمية من سقف الصفقة
    cap = float(payload.max_trade_amount or settings.MAX_TRADE_AMOUNT or 500.0)
    qty = max(1, math.floor(cap / last))

    alert = Alert(symbol=payload.symbol, side=side, qty_shares=qty, note=payload.note or d.reason, price=last)
    result = _execute(alert)
    result.update({"ai_confidence": round(d.confidence, 2), "ai_reason": d.reason})
    return result

# ===== باقي الـAPI (المحفظة/المراكز/الأسعار/الواتش ليست/القتل/التنفيذ اليدوي/التصفية) =====
@router.post("/manual")
def manual(symbol: str = Form(...), side: str = Form(...), qty_shares: int = Form(...), note: str | None = Form(None)):
    alert = Alert(symbol=symbol, side=side, qty_shares=int(qty_shares), note=note)
    _execute(alert)
    return RedirectResponse(url="/dashboard", status_code=303)

@router.get("/kill")
def kill_status(): return {"kill_on": is_kill_switch_on()}
@router.post("/kill/toggle")
def kill_toggle():
    state_on = toggle_kill_switch()
    notify.send(f"🛑 Kill Switch: {'ON' if state_on else 'OFF'}")
    return {"kill_on": state_on}

@router.get("/api/portfolio")
def api_portfolio():
    buys, sells = sum_buys_sells()
    positions = get_open_positions()
    symbols = [p["symbol"] for p in positions]
    prices = get_prices(symbols) if symbols else {}
    market_val = sum(p["net_qty"] * prices.get(p["symbol"], 0.0) for p in positions)
    cash = settings.BASE_CAPITAL - buys + sells
    equity = cash + market_val
    pnl = equity - settings.BASE_CAPITAL
    pnl_pct = (pnl / settings.BASE_CAPITAL) * 100.0 if settings.BASE_CAPITAL > 0 else 0.0
    return {
        "base_capital": round(settings.BASE_CAPITAL, 2),
        "cash": round(cash, 2),
        "market_value": round(market_val, 2),
        "equity": round(equity, 2),
        "pnl": round(pnl, 2),
        "pnl_pct": round(pnl_pct, 2)
    }

@router.get("/api/open-positions")
def api_open_positions():
    positions = get_open_positions()
    symbols = [p["symbol"] for p in positions]
    prices = get_prices(symbols) if symbols else {}
    out = []
    for p in positions:
        cur = prices.get(p["symbol"], 0.0)
        pnl = (cur - p["avg_cost"]) * p["net_qty"]
        pnl_pct = ((cur / p["avg_cost"]) - 1.0) * 100.0 if p["avg_cost"] > 0 else 0.0
        out.append({
            "symbol": p["symbol"], "qty": p["net_qty"], "avg_cost": round(p["avg_cost"], 4),
            "last": round(cur, 4), "pnl": round(pnl, 2), "pnl_pct": round(pnl_pct, 2)
        })
    return {"positions": out}

@router.get("/api/quotes")
def api_quotes(symbols: str = ""):
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not syms:
        syms = get_watchlist()
    prices = get_prices(syms) if syms else {}
    return {"quotes": prices}

@router.get("/api/quotes/list")
def api_quotes_list(symbols: str = ""):
    syms = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not syms:
        syms = get_watchlist()
    data = get_quotes_details(syms) if syms else []
    return {"quotes": data}

@router.get("/api/trades")
def api_trades(limit: int = 100):
    try:
        trades = get_recent_trades(limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to load trades: {exc}") from exc
    return {"trades": trades}

@router.get("/api/watchlist")
def api_watchlist_get(): return {"watchlist": get_watchlist()}
@router.post("/api/watchlist/add")
def api_watchlist_add(symbol: str = Form(...)):
    symbols = get_watchlist()
    s = symbol.strip().upper()
    if s and s not in symbols:
        symbols.append(s); set_watchlist(symbols)
    return {"watchlist": symbols}
@router.post("/api/watchlist/remove")
def api_watchlist_remove(symbol: str = Form(...)):
    symbols = [x for x in get_watchlist() if x != symbol.strip().upper()]
    set_watchlist(symbols); return {"watchlist": symbols}

@router.post("/liquidate-all")
def liquidate_all():
    positions = get_open_positions()
    results = []
    for p in positions:
        symbol, qty = p["symbol"], int(p["net_qty"])
        if qty <= 0: continue
        price = broker.get_last_price(symbol)
        broker.submit_order(symbol, "sell", qty)
        log_trade(symbol, "sell", qty, price, "liquidate-all")
        results.append({"symbol": symbol, "sold_qty": qty, "price": price})
    notify.send(f"🚪 Liquidate All — {len(results)} رمز")
    return {"ok": True, "closed": results}

@router.get("/ping-telegram")
def ping_telegram():
    try:
        res = notify.send("🔔 اختبار تنبيه من البوت")
        return {"ok": True, "telegram_enabled": notify.enabled(), "telegram_response": res}
    except Exception as e:
        return {"ok": False, "telegram_enabled": notify.enabled(), "error": str(e)}


@router.get("/debug/secret")
def debug_secret():
    # ⚠️ لا تتركه مفعلاً في الإنتاج
    return {"expected_WEBHOOK_SECRET": settings.webhook_secret}


from fastapi import Request, Header

@router.post("/debug/echo")
async def debug_echo(request: Request, x_hook_secret: str | None = Header(default=None)):
    from urllib.parse import urlparse, parse_qs
    url = str(request.url)
    qs  = parse_qs(urlparse(url).query)
    secret_q = (qs.get('secret',[None]) or [None])[0]
    expected = settings.webhook_secret
    return {
        "url": url,
        "expected_present": bool(expected),
        "secret_query": secret_q,
        "secret_header": x_hook_secret,
        "match_query": secret_q == expected,
        "match_header": x_hook_secret == expected
    }


from urllib.parse import urlparse, parse_qs

@router.post("/webhook-tv2")
async def webhook_tv2(
    payload: TVPayload,
    request: Request,
):
    # نقرأ السر من الـ query فقط
    url = str(request.url)
    qs  = parse_qs(urlparse(url).query)
    secret_q = (qs.get('secret', [None]) or [None])[0]
    expected = settings.webhook_secret

    # تشخيص واضح
    resp_dbg = {
        "url": url,
        "expected_present": bool(expected),
        "secret_query": secret_q,
        "match_query": (secret_q or "") == expected
    }

    if expected and (secret_q or "") != expected:
        # نُرجع 401 مع تفاصيل تشخيص (مؤقتًا أثناء التطوير)
        raise HTTPException(status_code=401, detail={"err":"Invalid secret (query)","debug":resp_dbg})

    # قرار المؤشرات
    d = decide_from_indicators(
        rsi=payload.rsi,
        macd=payload.macd,
        macd_signal=payload.macd_signal,
        ema_fast=payload.ema_fast,
        ema_slow=payload.ema_slow,
        trend_strength=payload.trend_strength
    )

    if d.action == "hold":
        notify.send(f"🟡 HOLD {payload.symbol} — {d.reason}")
        return {"ok": True, "action": "hold", "reason": d.reason, "confidence": round(d.confidence,2), "debug": resp_dbg}

    side = d.action
    last = payload.price or broker.get_last_price(payload.symbol)
    if not last or last <= 0:
        raise HTTPException(status_code=400, detail={"err":"No valid price","debug":resp_dbg})

    import math
    cap = float(payload.max_trade_amount or settings.MAX_TRADE_AMOUNT or 500.0)
    qty = max(1, math.floor(cap / last))

    alert = Alert(symbol=payload.symbol, side=side, qty_shares=qty, note=payload.note or d.reason, price=last)
    result = _execute(alert)
    result.update({"ai_confidence": round(d.confidence, 2), "ai_reason": d.reason, "debug": resp_dbg})
    return result
