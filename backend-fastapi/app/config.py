import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., validation_alias="DATABASE_URL")
    RAZORPAY_KEY_ID: str = Field(..., validation_alias="RAZORPAY_KEY_ID")
    RAZORPAY_KEY_SECRET: str = Field(..., validation_alias="RAZORPAY_KEY_SECRET")
    RAZORPAY_WEBHOOK_SECRET: str = Field(..., validation_alias="RAZORPAY_WEBHOOK_SECRET")
    PORT: int = Field(8000, validation_alias="PORT")
    NODE_ENV: str = Field("development", validation_alias="NODE_ENV")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
