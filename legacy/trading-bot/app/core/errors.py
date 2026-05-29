from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping


@dataclass(slots=True)
class BotError(Exception):
    """
    Base error for bot operations with structured metadata.
    """

    message: str
    code: str = "bot_error"
    status_code: int = 500
    details: Mapping[str, Any] | None = None

    def __str__(self) -> str:
        return f"{self.code}: {self.message}"


class UserError(BotError):
    code = "user_error"
    status_code = 400


class TransientError(BotError):
    code = "transient_error"
    status_code = 503


class InternalError(BotError):
    code = "internal_error"
    status_code = 500
