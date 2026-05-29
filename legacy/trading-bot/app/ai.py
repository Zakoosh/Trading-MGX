from dataclasses import dataclass

@dataclass
class Decision:
    action: str   # "buy" | "sell" | "hold"
    confidence: float
    reason: str

def decide_from_indicators(
    rsi: float | None = None,
    macd: float | None = None,
    macd_signal: float | None = None,
    ema_fast: float | None = None,
    ema_slow: float | None = None,
    trend_strength: float | None = None
) -> Decision:
    """
    منطق أولي مبسّط:
    - BUY: RSI<=30 أو (EMA_fast>EMA_slow & MACD>Signal)
    - SELL: RSI>=70 أو (EMA_fast<EMA_slow & MACD<Signal)
    - غير ذلك: HOLD
    """
    reasons = []
    score_buy = 0
    score_sell = 0

    if rsi is not None:
        if rsi <= 30: score_buy += 1; reasons.append(f"RSI<=30({rsi:.1f})")
        if rsi >= 70: score_sell += 1; reasons.append(f"RSI>=70({rsi:.1f})")

    if (ema_fast is not None) and (ema_slow is not None):
        if ema_fast > ema_slow:
            score_buy += 1; reasons.append("EMA fast>slow")
        elif ema_fast < ema_slow:
            score_sell += 1; reasons.append("EMA fast<slow")

    if (macd is not None) and (macd_signal is not None):
        if macd > macd_signal:
            score_buy += 1; reasons.append("MACD>Signal")
        elif macd < macd_signal:
            score_sell += 1; reasons.append("MACD<Signal")

    # ترجيح اتجاه واضح
    if score_buy > score_sell and score_buy >= 2:
        conf = min(1.0, 0.3 + 0.3*score_buy + (0.1*(trend_strength or 0)))
        return Decision("buy", conf, " & ".join(reasons))
    if score_sell > score_buy and score_sell >= 2:
        conf = min(1.0, 0.3 + 0.3*score_sell + (0.1*(trend_strength or 0)))
        return Decision("sell", conf, " & ".join(reasons))
    return Decision("hold", 0.2, "No strong signal")
