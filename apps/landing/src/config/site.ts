export type WhatsAppTrafficSource = "organic" | "facebook" | "tiktok";

export const whatsappMessages: Record<WhatsAppTrafficSource, string> = {
  organic:
    "Hola, encontré Multiservicios 24/7 mediante una búsqueda y quiero solicitar una demostración para mi taller.",
  facebook:
    "Hola, vi Multiservicios 24/7 en Facebook y quiero solicitar una demostración para mi taller.",
  tiktok:
    "Hola, vi Multiservicios 24/7 en TikTok y quiero solicitar una demostración para mi taller.",
};

const whatsappBaseUrl = "https://wa.me/526675787701";

export const whatsappUrls = Object.fromEntries(
  Object.entries(whatsappMessages).map(([source, message]) => [
    source,
    `${whatsappBaseUrl}?text=${encodeURIComponent(message)}`,
  ]),
) as Record<WhatsAppTrafficSource, string>;

const contactEmail =
  import.meta.env.PUBLIC_CONTACT_EMAIL?.trim() ||
  "contacto@multiservicios247.com";
const googleSiteVerification =
  import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || null;

export const site = {
  name: "Multiservicios 24/7",
  shortName: "MS 24/7",
  url: "https://www.multiservicios247.com",
  appUrl: "https://app.multiservicios247.com",
  whatsappNumber: "526675787701",
  whatsappDisplay: "+52 667 578 7701",
  whatsappBaseUrl,
  whatsappUrl: whatsappUrls.organic,
  contactEmail,
  googleSiteVerification,
  title: "Software para talleres mecánicos | Multiservicios 24/7",
  description:
    "Administra clientes, vehículos, órdenes, inventario, compras y gastos. Conoce la utilidad de tu taller. Solicita una demostración por WhatsApp.",
} as const;
