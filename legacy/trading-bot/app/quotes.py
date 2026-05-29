import yfinance as yf

def _safe_info(t: yf.Ticker) -> dict:
    try:
        return t.info or {}
    except Exception:
        return {}

def get_last_price(symbol: str) -> float:
    try:
        t = yf.Ticker(symbol)
        p = t.fast_info.get("last_price")
        if p is None:
            hist = t.history(period="1d")
            if not hist.empty:
                p = float(hist["Close"].iloc[-1])
        return float(p) if p is not None else 0.0
    except Exception:
        return 0.0

def get_quote_detail(symbol: str) -> dict:
    """
    يرجّع: {"symbol","name","last","change_pct"}
    change_pct = نسبة التغير اليومية % (أخضر/أحمر)
    """
    symbol = symbol.strip().upper()
    t = yf.Ticker(symbol)
    last = 0.0; change_pct = 0.0; name = symbol

    try:
        last = t.fast_info.get("last_price") or 0.0
        prev = t.fast_info.get("previous_close")
        if (prev is None or prev == 0) and last:
            hist = t.history(period="2d")
            if len(hist) >= 2:
                prev = float(hist["Close"].iloc[-2])
        if last and prev:
            change_pct = (float(last) / float(prev) - 1.0) * 100.0
    except Exception:
        pass

    info = _safe_info(t)
    if info:
        name = info.get("shortName") or info.get("longName") or symbol

    return {
        "symbol": symbol,
        "name": name,
        "last": round(float(last or 0.0), 4),
        "change_pct": round(float(change_pct or 0.0), 2)
    }

def get_quotes_details(symbols: list[str]) -> list[dict]:
    return [get_quote_detail(s) for s in symbols if s.strip()]

def get_prices(symbols: list[str]) -> dict[str, float]:
    """
    يرجّع قاموس {symbol: last_price} باستخدام get_last_price لكل رمز.
    """
    out: dict[str, float] = {}
    for s in symbols or []:
        ss = (s or "").strip().upper()
        if not ss:
            continue
        out[ss] = float(get_last_price(ss))
    return out
