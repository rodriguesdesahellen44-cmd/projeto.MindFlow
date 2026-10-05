from database import database


MAX_SQLITE_INTEGER = (1 << 63) - 1


def _text(value, field, limit):
    if not isinstance(value, str) or len(value) > limit:
        raise ValueError(f"Campo inválido: {field}")
    return value


def _identifier(value, field):
    if (
        isinstance(value, bool)
        or not isinstance(value, int)
        or value < 0
        or value > MAX_SQLITE_INTEGER
    ):
        raise ValueError(f"Identificador inválido: {field}")
    return value


def _records(value, field):
    if not isinstance(value, list):
        raise ValueError(f"Campo inválido: {field}")
    if not all(isinstance(item, dict) for item in value):
        raise ValueError(f"Registro inválido: {field}")
    return value


def normalize_state(payload):
    if not isinstance(payload, dict):
        raise ValueError("O estado do aplicativo deve ser um objeto.")

    xp = payload.get("xp", 0)
    if (
        isinstance(xp, bool)
        or not isinstance(xp, int)
        or xp < 0
        or xp > MAX_SQLITE_INTEGER
    ):
        raise ValueError("O campo xp deve ser um inteiro não negativo.")

    favorite_word = payload.get("favoriteWord", False)
    if not isinstance(favorite_word, bool):
        raise ValueError("O campo favoriteWord deve ser booleano.")

    theme = _text(payload.get("theme", "light"), "theme", 10)
    if theme not in ("light", "dark"):
        raise ValueError("Tema inválido.")

    entries = []
    for item in _records(payload.get("entries", []), "entries"):
        entries.append(
            {
                "id": _identifier(item.get("id"), "entries.id"),
                "date": _text(item.get("date"), "entries.date", 10),
                "time": _text(item.get("time"), "entries.time", 5),
                "mood": _text(item.get("mood"), "entries.mood", 50),
                "title": _text(item.get("title"), "entries.title", 80),
                "text": _text(item.get("text"), "entries.text", 10000),
                "tags": _text(item.get("tags", ""), "entries.tags", 500),
            }
        )
    if len({item["id"] for item in entries}) != len(entries):
        raise ValueError("Os identificadores das entradas devem ser únicos.")

    moods = []
    for item in _records(payload.get("moods", []), "moods"):
        moods.append(
            {
                "id": _identifier(item.get("id"), "moods.id"),
                "date": _text(item.get("date"), "moods.date", 10),
                "mood": _text(item.get("mood"), "moods.mood", 50),
                "event": _text(item.get("event", ""), "moods.event", 5000),
                "more": _text(item.get("more", ""), "moods.more", 5000),
                "good": _text(item.get("good", ""), "moods.good", 5000),
                "thought": _text(item.get("thought", ""), "moods.thought", 5000),
            }
        )
    if len({item["id"] for item in moods}) != len(moods):
        raise ValueError("Os identificadores dos humores devem ser únicos.")

    reflections = []
    for item in _records(payload.get("reflections", []), "reflections"):
        reflections.append(
            {
                "question": _text(
                    item.get("question"), "reflections.question", 500
                ),
                "answer": _text(item.get("answer"), "reflections.answer", 10000),
                "date": _identifier(item.get("date"), "reflections.date"),
            }
        )

    missions = payload.get("missions", [])
    if not isinstance(missions, list):
        raise ValueError("Campo inválido: missions")
    missions = [_text(item, "missions", 100) for item in missions]

    return {
        "name": _text(payload.get("name", ""), "name", 100),
        "avatar": _text(payload.get("avatar", "🌱"), "avatar", 20),
        "xp": xp,
        "entries": entries,
        "moods": moods,
        "reflections": reflections,
        "missions": missions,
        "wordNote": _text(payload.get("wordNote", ""), "wordNote", 10000),
        "favoriteWord": favorite_word,
        "theme": theme,
    }


def read_state():
    with database() as connection:
        profile = connection.execute(
            "SELECT * FROM app_profile WHERE id = 1"
        ).fetchone()
        if profile is None or not profile["state_initialized"]:
            return None

        state = {
            "name": profile["name"],
            "avatar": profile["avatar"],
            "xp": profile["xp"],
            "entries": [],
            "moods": [],
            "reflections": [],
            "missions": [],
            "wordNote": profile["word_note"],
            "favoriteWord": bool(profile["favorite_word"]),
            "theme": profile["theme"],
        }
        state["entries"] = [
            {
                "id": row["id"],
                "date": row["entry_date"],
                "time": row["entry_time"],
                "mood": row["mood"],
                "title": row["title"],
                "text": row["text"],
                "tags": row["tags"],
            }
            for row in connection.execute(
                "SELECT * FROM journal_entry ORDER BY position"
            )
        ]
        state["moods"] = [
            {
                "id": row["id"],
                "date": row["record_date"],
                "mood": row["mood"],
                "event": row["event"],
                "more": row["more"],
                "good": row["good"],
                "thought": row["thought"],
            }
            for row in connection.execute(
                "SELECT * FROM mood_record ORDER BY position"
            )
        ]
        state["reflections"] = [
            {
                "question": row["question"],
                "answer": row["answer"],
                "date": row["reflection_date"],
            }
            for row in connection.execute(
                "SELECT * FROM reflection ORDER BY position"
            )
        ]
        state["missions"] = [
            row["mission"]
            for row in connection.execute(
                "SELECT mission FROM completed_mission ORDER BY position"
            )
        ]
        return state


def write_state(payload):
    state = normalize_state(payload)
    with database() as connection:
        connection.execute(
            """
            INSERT INTO app_profile
                (id, name, avatar, xp, word_note, favorite_word, theme, state_initialized)
            VALUES (1, ?, ?, ?, ?, ?, ?, 1)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                avatar = excluded.avatar,
                xp = excluded.xp,
                word_note = excluded.word_note,
                favorite_word = excluded.favorite_word,
                theme = excluded.theme,
                state_initialized = 1
            """,
            (
                state["name"],
                state["avatar"],
                state["xp"],
                state["wordNote"],
                int(state["favoriteWord"]),
                state["theme"],
            ),
        )
        for table in (
            "journal_entry",
            "mood_record",
            "reflection",
            "completed_mission",
        ):
            connection.execute(f"DELETE FROM {table}")

        connection.executemany(
            """
            INSERT INTO journal_entry
                (id, position, entry_date, entry_time, mood, title, text, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    item["id"],
                    position,
                    item["date"],
                    item["time"],
                    item["mood"],
                    item["title"],
                    item["text"],
                    item["tags"],
                )
                for position, item in enumerate(state["entries"])
            ],
        )
        connection.executemany(
            """
            INSERT INTO mood_record
                (id, position, record_date, mood, event, more, good, thought)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    item["id"],
                    position,
                    item["date"],
                    item["mood"],
                    item["event"],
                    item["more"],
                    item["good"],
                    item["thought"],
                )
                for position, item in enumerate(state["moods"])
            ],
        )
        connection.executemany(
            """
            INSERT INTO reflection (position, question, answer, reflection_date)
            VALUES (?, ?, ?, ?)
            """,
            [
                (position, item["question"], item["answer"], item["date"])
                for position, item in enumerate(state["reflections"])
            ],
        )
        connection.executemany(
            """
            INSERT INTO completed_mission (position, mission)
            VALUES (?, ?)
            """,
            [(position, mission) for position, mission in enumerate(state["missions"])],
        )
