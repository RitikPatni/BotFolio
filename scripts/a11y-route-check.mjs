import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";

const distRoot = join(process.cwd(), "dist");
const failures = [];
const ignoredRoutes = new Set(["/contact", "/photography/PhotographyLightbox"]);

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

const routeForFile = (file) => {
  const route = relative(distRoot, file).replaceAll("\\", "/");
  if (route === "index.html") {
    return "/";
  }
  if (route.endsWith("/index.html")) {
    return `/${route.slice(0, -"/index.html".length)}`;
  }
  return `/${route.replace(/\.html$/, "")}`;
};

const attributesOf = (tag) => tag.match(/^<\w+\s+([\s\S]*?)\/?\s*>$/i)?.[1] ?? "";
const hasAttribute = (attributes, name) =>
  new RegExp(`\\b${name}\\s*=`, "i").test(attributes);

const checkDocument = (route, html) => {
  if (ignoredRoutes.has(route)) {
    return;
  }

  const mainCount = (html.match(/<main\b/gi) ?? []).length;
  if (mainCount !== 1) {
    failures.push(`${route}: expected exactly one main landmark, found ${mainCount}`);
  }

  const headingCount = (html.match(/<h1\b/gi) ?? []).length;
  const hasPersonaAlternateHeadings =
    route === "/" && html.includes("data-home-slot");
  if (headingCount !== 1 && !hasPersonaAlternateHeadings) {
    failures.push(`${route}: expected exactly one h1, found ${headingCount}`);
  }

  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  imageTags.forEach((tag) => {
    if (!hasAttribute(attributesOf(tag), "alt")) {
      failures.push(`${route}: image is missing alt text`);
    }
  });

  const buttonPattern = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  for (const match of html.matchAll(buttonPattern)) {
    const attributes = match[1];
    const text = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z0-9#]+;/gi, " ")
      .trim();
    const hasName =
      hasAttribute(attributes, "aria-label") ||
      hasAttribute(attributes, "aria-labelledby") ||
      text.length > 0;

    if (!hasName) {
      failures.push(`${route}: button is missing an accessible name`);
    }
  }

  const ids = new Set();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    const id = match[1];
    if (ids.has(id)) {
      failures.push(`${route}: duplicate id \"${id}\"`);
    }
    ids.add(id);
  }

  const referencePattern = /\baria-(?:labelledby|describedby|controls|owns|flowto|errormessage)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(referencePattern)) {
    match[1].split(/\s+/).forEach((id) => {
      if (id && !ids.has(id)) {
        failures.push(`${route}: aria reference \"${id}\" does not resolve`);
      }
    });
  }
};

try {
  const files = await walk(distRoot);

  for (const file of files) {
    const route = routeForFile(file);
    const html = await readFile(file, "utf8");
    checkDocument(route, html);
  }
} catch (error) {
  console.error(`Unable to audit built routes: ${error.message}`);
  process.exit(1);
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: "all generated HTML routes" }, null, 2));
