import { DatabaseSync } from "node:sqlite";
import { onRequestGet, onRequestPost } from "../functions/api/likes.js";

const SCHEMA = `
CREATE TABLE like_counts (slug TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE like_actions (visitor_hash TEXT NOT NULL, slug TEXT NOT NULL,
  likes_given INTEGER NOT NULL DEFAULT 0, last_ts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (visitor_hash, slug));
CREATE TABLE like_rate (visitor_hash TEXT NOT NULL, window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (visitor_hash, window_start));
`;

class FakeD1 {
  constructor() {
    this.db = new DatabaseSync(":memory:");
    this.db.exec(SCHEMA);
  }
  prepare(sql) {
    const statement = this.db.prepare(sql);
    return {
      bind: (...params) => ({
        first: async () => statement.get(...params) ?? null,
        run: async () => statement.run(...params),
      }),
      first: async () => statement.get() ?? null,
      run: async () => statement.run(),
    };
  }
}

const e = { LIKES_DB: new FakeD1(), LIKES_SALT: "test-salt" };
const post = (slug, ip) =>
  onRequestPost({
    request: new Request("https://site.test/api/likes", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": ip },
      body: JSON.stringify({ slug }),
    }),
    env: e,
    waitUntil: () => {},
  });

for (let i = 1; i <= 3; i++) {
  const res = await post("my-post", "203.0.113.7");
  console.log("v1 like", i, res.status, await res.text());
}
for (let i = 1; i <= 3; i++) {
  const res = await post("my-post", "198.51.100.9");
  console.log("v2 like", i, res.status, await res.text());
}
console.log("tables:", ...e.LIKES_DB.db.prepare("SELECT visitor_hash, likes_given FROM like_actions").all());
