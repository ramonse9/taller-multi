import { existsSync, readFileSync } from "node:fs";

const dist = new URL("../dist/", import.meta.url);
const failures = [];

function read(relativePath) {
  const path = new URL(relativePath, dist);
  if (!existsSync(path)) {
    failures.push(`No existe ${relativePath}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function count(html, expression) {
  return [...html.matchAll(expression)].length;
}

function pngDimensions(relativePath) {
  const path = new URL(relativePath, dist);
  if (!existsSync(path)) {
    failures.push(`No existe ${relativePath}`);
    return null;
  }
  const bytes = readFileSync(path);
  expect(bytes.subarray(1, 4).toString("ascii") === "PNG", `${relativePath} no es PNG`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const home = read("index.html");
const privacy = read("aviso-de-privacidad/index.html");
const notFound = read("404.html");
const robots = read("robots.txt");
const sitemap = read("sitemap.xml");

expect(home.includes("<title>Software para talleres mecánicos | Multiservicios 24/7</title>"), "Falta el title principal");
expect(home.includes('name="description"'), "Falta meta description");
expect(home.includes('rel="canonical" href="https://www.multiservicios247.com/"'), "Canonical principal incorrecto");
expect(home.includes('name="robots" content="index, follow"'), "La página principal no es indexable");
expect(count(home, /<h1(?:\s|>)/g) === 1, "La página principal debe tener exactamente un H1");
expect(home.includes("Controla cada orden y conoce la"), "El contenido principal no está en el HTML estático");

for (const property of ["og:title", "og:description", "og:url", "og:image", "og:image:width", "og:image:height"]) {
  expect(home.includes(`property="${property}"`), `Falta ${property}`);
}
for (const name of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
  expect(home.includes(`name="${name}"`), `Falta ${name}`);
}

const jsonLdMatch = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
expect(Boolean(jsonLdMatch), "Faltan datos estructurados JSON-LD");
if (jsonLdMatch) {
  try {
    const jsonLd = JSON.parse(jsonLdMatch[1]);
    const types = new Set(jsonLd["@graph"]?.map((entry) => entry["@type"]));
    for (const type of ["Organization", "WebSite", "SoftwareApplication"]) {
      expect(types.has(type), `Falta el tipo JSON-LD ${type}`);
    }
    expect(!types.has("LocalBusiness"), "No debe utilizarse LocalBusiness");
  } catch (error) {
    failures.push(`JSON-LD inválido: ${error.message}`);
  }
}

expect(privacy.includes("<title>Aviso de privacidad | Multiservicios 24/7</title>"), "Title de privacidad incorrecto");
expect(privacy.includes('rel="canonical" href="https://www.multiservicios247.com/aviso-de-privacidad/"'), "Canonical de privacidad incorrecto");
expect(!privacy.includes('"@type":"SoftwareApplication"'), "Privacidad no debe describirse como SoftwareApplication");
expect(notFound.includes("<title>Página no encontrada | Multiservicios 24/7</title>"), "Title de 404 incorrecto");
expect(notFound.includes('name="robots" content="noindex, nofollow"'), "La página 404 debe ser noindex");
expect(!notFound.includes('type="application/ld+json"'), "La página 404 no debe publicar JSON-LD");

expect(robots.includes("User-agent: *"), "robots.txt no declara User-agent");
expect(robots.includes("Sitemap: https://www.multiservicios247.com/sitemap.xml"), "robots.txt no declara el sitemap");
expect(sitemap.includes("https://www.multiservicios247.com/</loc>"), "El sitemap no incluye el inicio");
expect(sitemap.includes("https://www.multiservicios247.com/aviso-de-privacidad/"), "El sitemap no incluye privacidad");
expect(!sitemap.includes("/404"), "El sitemap no debe incluir la página 404");

const socialImage = pngDimensions("social/og-multiservicios-247.png");
if (socialImage) {
  expect(socialImage.width === 1200 && socialImage.height === 630, "La imagen social debe medir 1200x630");
}
for (const asset of ["favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "site.webmanifest"]) {
  expect(existsSync(new URL(asset, dist)), `Falta ${asset}`);
}

if (failures.length) {
  console.error(`Validación SEO fallida (${failures.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Validación SEO correcta: HTML indexable, metadatos, JSON-LD, sitemap, robots e imágenes sociales.");
