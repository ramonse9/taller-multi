import { whatsappUrls, type WhatsAppTrafficSource } from "../config/site";

type TrackingWindow = Window & {
  dataLayer?: Record<string, unknown>[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const searchParameters = new URLSearchParams(window.location.search);
const campaignSource = searchParameters.get("utm_source")?.toLowerCase();
const referrer = document.referrer.toLowerCase();

function detectTrafficSource(): WhatsAppTrafficSource {
  const origin = `${campaignSource ?? ""} ${referrer}`;

  if (searchParameters.has("ttclid") || origin.includes("tiktok")) return "tiktok";
  if (
    searchParameters.has("fbclid") ||
    origin.includes("facebook") ||
    origin.includes("fb.com") ||
    origin.includes("meta")
  ) {
    return "facebook";
  }

  return "organic";
}

const trafficSource = detectTrafficSource();
const trackingWindow = window as TrackingWindow;

document.querySelectorAll<HTMLAnchorElement>("[data-whatsapp-link]").forEach((link) => {
  link.href = whatsappUrls[trafficSource];
  link.dataset.whatsappSource = trafficSource;

  link.addEventListener(
    "click",
    () => {
      const placement = link.dataset.whatsappPlacement ?? "unknown";
      const parameters = {
        method: "whatsapp",
        traffic_source: trafficSource,
        link_placement: placement,
      };

      if (typeof trackingWindow.gtag === "function") {
        trackingWindow.gtag("event", "generate_lead", parameters);
      } else {
        trackingWindow.dataLayer = trackingWindow.dataLayer ?? [];
        trackingWindow.dataLayer.push({ event: "whatsapp_click", ...parameters });
      }

      if (typeof trackingWindow.fbq === "function") {
        trackingWindow.fbq("track", "Contact", parameters);
      }

      window.dispatchEvent(
        new CustomEvent("landing:whatsapp-click", { detail: parameters }),
      );
    },
    { capture: true },
  );
});
