import { access, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const distRoot = join(process.cwd(), "dist");
const failures = [];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.name.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
};

const routeFile = (pathname) => {
  const cleanPath = pathname.replace(/\/$/, "") || "/";
  return cleanPath === "/"
    ? join(distRoot, "index.html")
    : join(distRoot, cleanPath.slice(1), "index.html");
};

const staticFile = (pathname) => join(distRoot, pathname.replace(/^\//, ""));

const assertRoute = async (pathname, reason) => {
  try {
    await access(pathname.includes(".") ? staticFile(pathname) : routeFile(pathname));
  } catch {
    failures.push(`${reason}: missing generated route ${pathname}`);
  }
};

try {
  await access(distRoot);
  const files = await walk(distRoot);
  const htmlDocuments = await Promise.all(
    files.map(async (file) => [file, await readFile(file, "utf8")]),
  );

  const studioNav = htmlDocuments.find(([, html]) =>
    html.includes('data-persona-nav="studio"'),
  )?.[1] ?? "";
  const fieldNav = htmlDocuments.find(([, html]) =>
    html.includes('data-persona-nav="field"'),
  )?.[1] ?? "";

  for (const href of ["/library", "/uses"]) {
    if (!studioNav.includes(`href=\"${href}\"`)) {
      failures.push(`studio navigation is missing shared route ${href}`);
    }
    if (!fieldNav.includes(`href=\"${href}\"`)) {
      failures.push(`field navigation is missing shared route ${href}`);
    }
  }

  for (const route of ["/", "/about", "/blog", "/coding", "/library", "/photography", "/uses"]) {
    await assertRoute(route, "required route contract");
  }

  const internalLinks = new Set();
  for (const [, html] of htmlDocuments) {
    for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
      const href = match[1];
      if (!href.startsWith("/") || href.startsWith("//")) {
        continue;
      }
      internalLinks.add(href.split(/[?#]/, 1)[0] || "/");
    }
  }

  for (const href of internalLinks) {
    await assertRoute(href, "internal link contract");
  }
} catch (error) {
  console.error(`Unable to check route contracts: ${error.message}`);
  process.exit(1);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: "routes, shared nav, and internal links" }, null, 2));
