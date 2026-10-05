import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DATABASE_PATH = Path(
    os.environ.get("MINDFLOW_DB_PATH", ROOT / "data" / "mindflow.sqlite3")
).resolve()
SCHEMA_PATH = ROOT / "database" / "sqlite_schema.sql"


def connect_database():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


@contextmanager
def database():
    connection = connect_database()
    try:
        with connection:
            yield connection
    finally:
        connection.close()


def initialize_database():
    with database() as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
