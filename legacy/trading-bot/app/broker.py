from time import time
from .quotes import get_last_price

class PaperBroker:
    def get_last_price(self, symbol: str) -> float:
        p = get_last_price(symbol)
        return p if p > 0 else 100.0  # احتياط

    def submit_order(self, symbol: str, side: str, qty: int, order_type="market", tif="day"):
        return {
            "id": f"paper-{int(time())}",
            "symbol": symbol,
            "side": side,
            "qty": int(qty),
            "type": order_type,
            "time_in_force": tif,
            "status": "accepted"
        }
