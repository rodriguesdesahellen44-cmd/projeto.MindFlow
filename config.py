import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "mindflow-local-development-key")
    MAX_CONTENT_LENGTH = 1_000_000
