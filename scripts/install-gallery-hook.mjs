#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const hooksDir = path.join(repoRoot, ".githooks");
const hookPath = path.join(hooksDir, "pre-commit");

const hookScript = `#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

STAGED=$(git diff --cached --name-only)
if [ -z "$STAGED" ]; then
  exit 0
fi

if echo "$STAGED" | grep -E '^(src/content/(blog|newsletter|books|highlights)/.*\\.md|src/content/config\\.ts|scripts/content-frontmatter-parity\\.mjs|scripts/goodreads-cover-parity\\.mjs|package\\.json|\\.github/workflows/content-frontmatter-parity\\.yml|\\.github/workflows/goodreads-cover-parity\\.yml)' >/dev/null; then
  echo "[content-hook] Detected content/frontmatter changes. Running parity check..."
  npm run -s content:frontmatter:parity
fi

if echo "$STAGED" | grep -E '^(src/content/books/.*\\.md|scripts/goodreads-cover-parity\\.mjs|package\\.json|\\.github/workflows/goodreads-cover-parity\\.yml)' >/dev/null; then
  echo "[books-hook] Detected book-cover changes. Running Goodreads cover parity check..."
  npm run -s books:covers:parity
fi

if echo "$STAGED" | grep -E '^(src/data/photography/|src/assets/photography/|scripts/validate-gallery\\.mjs|package\\.json|\\.github/workflows/gallery-qa\\.yml)' >/dev/null; then
  echo "[gallery-hook] Detected gallery-related changes. Running strict validator..."
  npm run -s gallery:validate:strict
else
  echo "[gallery-hook] No gallery-related staged changes. Skipping gallery validator."
fi
`;

async function main() {
  await fs.mkdir(hooksDir, { recursive: true });
  await fs.writeFile(hookPath, hookScript, "utf8");
  await fs.chmod(hookPath, 0o755);

  execSync("git config core.hooksPath .githooks", {
    cwd: repoRoot,
    stdio: "inherit",
  });

  console.log("Installed pre-commit hooks at .githooks/pre-commit");
  console.log("Configured git core.hooksPath to .githooks");
}

main().catch((error) => {
  console.error("Failed to install hooks:", error.message);
  process.exit(1);
});
