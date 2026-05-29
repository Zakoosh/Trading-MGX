from __future__ import annotations

import json
import logging
import sys
import time
import uuid
from typing import Any, Mapping

DEFAULT_LOG_LEVEL = "INFO"


class JsonFormatter(logging.Formatter):
    """
    Minimal structured JSON formatter for consistent downstream parsing.
    """

    def format(self, record: logging.LogRecord) -> str:
        base: dict[str, Any] = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(record.created)),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            base["exc_info"] = self.formatException(record.exc_info)

        for key, value in record.__dict__.items():
            if key.startswith("_") or key in base:
                continue
            if key in ("args", "msg"):
                continue
            if isinstance(value, (str, int, float, bool)) or value is None:
                base[key] = value
        return json.dumps(base, default=str)


def configure_logging(level: str | int = DEFAULT_LOG_LEVEL) -> None:
    """
    Configure application-wide logging once at process startup.
    """
    root = logging.getLogger()
    if root.handlers:
        # Assume logging already configured (e.g., by gunicorn)
        return

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter())

    logging.basicConfig(level=level, handlers=[handler])
    logging.getLogger("uvicorn.error").handlers = []
    logging.getLogger("uvicorn.access").handlers = []


def bind_logger(logger: logging.Logger, **extra: Any) -> logging.LoggerAdapter:
    """
    Return a logger adapter that injects additional context keys.
    """
    return logging.LoggerAdapter(logger, extra or {})


def correlation_id() -> str:
    """
    Generate a UUID-based correlation identifier for tracing requests.
    """
    return uuid.uuid4().hex
