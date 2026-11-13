#!/usr/bin/env node
// Usage: node scripts/birds/import-ebird.mjs <ebird-life-list.csv>
// Writes src/data/birds/life-list.json with names, slug and sighting years only.
// The raw export stays outside the repository.
import { readFileSync, writeFileSync } from "node:fs";
import { importLifeList } from "./lib.mjs";

const [csvPath] = process.argv.slice(2);
if (!csvPath) {
  console.error("Usage: node scripts/birds/import-ebird.mjs <ebird-life-list.csv>");
  process.exit(2);
}
const list = importLifeList(readFileSync(csvPath, "utf8"));
const out = new URL("../../src/data/birds/life-list.json", import.meta.url);
writeFileSync(out, `${JSON.stringify(list, null, 2)}\n`);
console.log(`Wrote ${list.length} species to src/data/birds/life-list.json`);
