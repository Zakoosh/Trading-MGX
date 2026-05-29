from typing import Any

import requests

from .config import settings

def _token() -> str:
    return settings.telegram_token


def _chat_id() -> str:
    return settings.telegram_chat_id

def enabled() -> bool:
    return bool(_token() and _chat_id())

def _sanitize(text: str) -> str:
    if not text:
        return text
    token = _token()
    if token:
        text = text.replace(f"bot{token}", "bot***")
        text = text.replace(token, "***")
    return text

def send(text: str, *, parse_mode: str | None = None) -> dict[str, Any]:
    if not enabled():
        return {"ok": False, "reason": "Telegram disabled (missing TOKEN/CHAT_ID)"}
    token = _token()
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload: dict[str, Any] = {"chat_id": _chat_id(), "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    try:
        r = requests.post(url, json=payload, timeout=15)
        r.raise_for_status()
        return r.json()
    except requests.HTTPError as e:
        return {
            "ok": False,
            "status_code": getattr(r, "status_code", None),
            "error": _sanitize(str(e)),
            "body": _sanitize(getattr(r, "text", ""))
        }
    except Exception as e:
        return {"ok": False, "error": _sanitize(str(e))}
