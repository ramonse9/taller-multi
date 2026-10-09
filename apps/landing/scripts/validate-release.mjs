import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const dist = resolve(new URL("../dist/", import.meta.url).pathname);
const failures = [];

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function destinationFor(pathname) {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  if (cleanPath === "/") return join(dist, "index.html");
  if (extname(cleanPath)) return join(dist, cleanPath);
  return join(dist, cleanPath, "index.html");
}

function idsIn(html) {
  return new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]));
}

const htmlFiles = walk(dist).filter((path) => path.endsWith(".html"));

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, "utf8");
  const currentPage = relative(dist, htmlFile);
  const currentIds = idsIn(html);

  for (const match of html.matchAll(/\shref=["']([^"']+)["']/g)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:)/.test(href)) continue;

    if (href.startsWith("#")) {
      if (!currentIds.has(decodeURIComponent(href.slice(1)))) {
        failures.push(`${currentPage}: no existe el destino ${href}`);
      }
      continue;
    }

    if (!href.startsWith("/")) continue;
    const [pathname, fragment] = href.split("#");
    const destination = destinationFor(pathname);
    if (!existsSync(destination)) {
      failures.push(`${currentPage}: enlace interno roto ${href}`);
      continue;
    }

    if (fragment && destination.endsWith(".html")) {
      const targetHtml = readFileSync(destination, "utf8");
      if (!idsIn(targetHtml).has(decodeURIComponent(fragment))) {
        failures.push(`${currentPage}: no existe el destino ${href}`);
      }
    }
  }
}

if (failures.length) {
  console.error(`Validación de publicación fallida (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `Validación de publicación correcta: ${htmlFiles.length} documentos HTML y sus enlaces internos.`,
);
