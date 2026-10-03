CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  consent_version TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS waitlist_created_at ON waitlist(created_at);
