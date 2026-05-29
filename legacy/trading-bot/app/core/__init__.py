"""
Core framework utilities shared across the trading bot.

This package exposes shared configuration, logging, and error-handling
primitives that higher-level modules (including the forthcoming BotMediator)
can rely on without creating circular imports.
"""

from .settings import get_settings, Settings

__all__ = ["get_settings", "Settings"]
