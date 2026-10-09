const consentKey = "ms247_analytics_consent";
const banner = document.querySelector<HTMLElement>("[data-analytics-consent]");

function readConsent(): string | null {
  try {
    return window.localStorage.getItem(consentKey);
  } catch {
    return null;
  }
}

function saveConsent(choice: "necessary" | "analytics"): void {
  try {
    window.localStorage.setItem(consentKey, choice);
  } catch {
    // The preference remains valid for this page even when storage is unavailable.
  }

  document.documentElement.dataset.analyticsConsent = choice;
  window.dispatchEvent(
    new CustomEvent("landing:analytics-consent", { detail: { choice } }),
  );
}

const savedConsent = readConsent();

if (savedConsent === "necessary" || savedConsent === "analytics") {
  document.documentElement.dataset.analyticsConsent = savedConsent;
} else if (banner) {
  banner.hidden = false;
  document.body.classList.add("analytics-consent-pending");
}

banner?.querySelectorAll<HTMLButtonElement>("[data-consent-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    const choice = button.dataset.consentChoice;
    if (choice !== "necessary" && choice !== "analytics") return;

    saveConsent(choice);
    banner.hidden = true;
    document.body.classList.remove("analytics-consent-pending");
  });
});
