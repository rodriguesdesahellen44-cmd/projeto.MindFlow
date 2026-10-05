CREATE TABLE IF NOT EXISTS app_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '🌱',
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  word_note TEXT NOT NULL DEFAULT '',
  favorite_word INTEGER NOT NULL DEFAULT 0 CHECK (favorite_word IN (0, 1)),
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  state_initialized INTEGER NOT NULL DEFAULT 0 CHECK (state_initialized IN (0, 1))
);

CREATE TABLE IF NOT EXISTS journal_entry (
  id INTEGER PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE,
  entry_date TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  mood TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS mood_record (
  id INTEGER PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE,
  record_date TEXT NOT NULL,
  mood TEXT NOT NULL,
  event TEXT NOT NULL DEFAULT '',
  more TEXT NOT NULL DEFAULT '',
  good TEXT NOT NULL DEFAULT '',
  thought TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS reflection (
  position INTEGER PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  reflection_date INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS completed_mission (
  position INTEGER PRIMARY KEY,
  mission TEXT NOT NULL
);

INSERT OR IGNORE INTO app_profile (id) VALUES (1);
