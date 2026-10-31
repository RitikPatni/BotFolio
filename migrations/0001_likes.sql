CREATE TABLE IF NOT EXISTS like_counts (
  slug TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0)
);

CREATE TABLE IF NOT EXISTS like_actions (
  visitor_hash TEXT NOT NULL,
  slug TEXT NOT NULL,
  likes_given INTEGER NOT NULL DEFAULT 0 CHECK (likes_given BETWEEN 0 AND 10),
  last_ts INTEGER NOT NULL,
  PRIMARY KEY (visitor_hash, slug)
);

CREATE TABLE IF NOT EXISTS like_rate (
  visitor_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0 CHECK (hits >= 0),
  PRIMARY KEY (visitor_hash, window_start)
);
