from functools import lru_cache
from typing import Any

from pydantic import Field, SecretStr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralised application settings parsed from environment variables.

    Uses Pydantic for type safety and automatic casting. Secrets are exposed
    via helper properties to avoid accidental logging.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    ENV: str = Field(default="paper")
    BASE_CAPITAL: float = Field(default=10_000.0)
    MAX_RISK_PCT: float = Field(default=0.01)
    MAX_PORTFOLIO_EXPOSURE_PCT: float = Field(default=0.3)
    MAX_TRADE_AMOUNT: float = Field(default=500.0)

    WEBHOOK_SECRET: SecretStr | None = None
    TELEGRAM_BOT_TOKEN: SecretStr | None = None
    TELEGRAM_CHAT_ID: str | None = None
    HMAC_SECRET: SecretStr | None = None

    ALPACA_BASE_URL: str | None = None
    ALPACA_KEY_ID: SecretStr | None = None
    ALPACA_SECRET_KEY: SecretStr | None = None

    @computed_field  # type: ignore[misc]
    @property
    def env(self) -> str:
        """
        Lower-case alias commonly used when branching behaviour by environment.
        """
        return (self.ENV or "paper").lower()

    def secret_value(self, secret: SecretStr | None) -> str:
        """
        Helper returning the secret's raw value without duplicating guard logic.
        """
        return secret.get_secret_value().strip() if secret else ""

    @property
    def telegram_token(self) -> str:
        return self.secret_value(self.TELEGRAM_BOT_TOKEN)

    @property
    def telegram_chat_id(self) -> str:
        return (self.TELEGRAM_CHAT_ID or "").strip()

    @property
    def webhook_secret(self) -> str:
        return self.secret_value(self.WEBHOOK_SECRET)

    @property
    def hmac_secret(self) -> str:
        return self.secret_value(self.HMAC_SECRET)

    def redact(self) -> dict[str, Any]:
        """
        Produce a dictionary with secrets redacted, useful for diagnostics.
        """
        data = self.model_dump()
        for key, value in list(data.items()):
            if isinstance(value, SecretStr):
                data[key] = "***"
        return data


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached Settings instance so modules can import and reuse it
    without repeatedly hitting the filesystem.
    """
    return Settings()  # type: ignore[call-arg]
