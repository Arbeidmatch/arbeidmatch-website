-- Run in Supabase SQL Editor (once).
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO site_settings (key, value)
VALUES ('tiktok_live', 'false')
ON CONFLICT (key) DO NOTHING;

-- Optional: lock down table — only service role (used by Next.js API) should read/write.
-- ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
-- (No anon policies: API uses service role key.)
