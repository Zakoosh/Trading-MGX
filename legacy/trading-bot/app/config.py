"""
Backward-compatible entry point exposing global settings.

Historically, modules imported `settings` directly from this module. We now
delegate to the richer Pydantic-powered configuration housed in
``app.core.settings`` while keeping the original import surface stable.
"""

from app.core.settings import Settings, get_settings

settings: Settings = get_settings()

__all__ = ["settings", "Settings", "get_settings"]
