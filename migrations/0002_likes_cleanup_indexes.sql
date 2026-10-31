CREATE INDEX IF NOT EXISTS like_actions_last_ts_idx ON like_actions(last_ts);
CREATE INDEX IF NOT EXISTS like_rate_window_start_idx ON like_rate(window_start);
