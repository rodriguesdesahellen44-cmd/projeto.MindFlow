import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import app
import database
from models import state


class MindFlowDatabaseTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temp_dir.name) / "mindflow.sqlite3"
        self.database_patch = patch.object(
            database, "DATABASE_PATH", self.database_path
        )
        self.database_patch.start()
        database.initialize_database()
        self.client = app.create_app().test_client()

    def tearDown(self):
        self.database_patch.stop()
        self.temp_dir.cleanup()

    def test_state_is_empty_before_first_save(self):
        self.assertIsNone(state.read_state())

    def test_state_round_trips_using_sql_tables(self):
        saved_state = {
            "name": "Lia",
            "avatar": "🌱",
            "xp": 35,
            "entries": [
                {
                    "id": 1001,
                    "date": "2026-10-01",
                    "time": "15:30",
                    "mood": "Bem",
                    "title": "Um dia bom",
                    "text": "Consegui descansar.",
                    "tags": "descanso",
                }
            ],
            "moods": [
                {
                    "id": 1002,
                    "date": "2026-10-01",
                    "mood": "Bem",
                    "event": "Uma conversa",
                    "more": "",
                    "good": "Saí para caminhar",
                    "thought": "Quero repetir",
                }
            ],
            "reflections": [
                {"question": "Do que você se orgulha?", "answer": "De mim.", "date": 1003}
            ],
            "missions": ["daily"],
            "wordNote": "Minha nota",
            "favoriteWord": True,
            "theme": "dark",
        }

        state.write_state(saved_state)

        self.assertEqual(state.read_state(), saved_state)

    def test_invalid_state_does_not_replace_saved_data(self):
        saved_state = {
            "name": "Lia",
            "avatar": "🌱",
            "xp": 10,
            "entries": [],
            "moods": [],
            "reflections": [],
            "missions": [],
            "wordNote": "",
            "favoriteWord": False,
            "theme": "light",
        }
        state.write_state(saved_state)

        with self.assertRaises(ValueError):
            state.write_state({**saved_state, "xp": -1})

        self.assertEqual(state.read_state(), saved_state)

    def test_flask_routes_serve_app_and_persist_state(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("MindFlow", response.get_data(as_text=True))

        asset_response = self.client.get("/static/style.css")
        self.assertEqual(asset_response.status_code, 200)
        self.assertIn(
            "/static/style.css",
            response.get_data(as_text=True),
        )
        asset_response.close()

        payload = {"name": "Lia", "xp": 10}
        response = self.client.put(
            "/api/state",
            data=json.dumps(payload),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.client.get("/api/state").get_json()["state"]["name"],
            "Lia",
        )
        self.assertEqual(self.client.get("/MindFlow.html").status_code, 302)
        self.assertEqual(self.client.get("/index.html").status_code, 302)
        self.assertEqual(self.client.get("/style.css").status_code, 302)

    def test_api_rejects_invalid_json_and_private_files(self):
        response = self.client.put(
            "/api/state",
            data=b"{invalid",
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.get_json())

        self.assertEqual(
            self.client.get("/database/sqlite_schema.sql").status_code,
            404,
        )
        self.assertEqual(self.client.get("/app.py").status_code, 404)

    def test_api_rejects_oversized_requests(self):
        response = self.client.put(
            "/api/state",
            data=b" " * 1_000_001,
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json()["error"],
            "Tamanho de solicitação inválido.",
        )


if __name__ == "__main__":
    unittest.main()
