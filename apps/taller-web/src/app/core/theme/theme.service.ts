import { Injectable, signal } from "@angular/core";

type ThemePreference = "light" | "dark";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly storageKey = "taller-multi-theme";
  readonly isDark = signal(this.initialPreference() === "dark");

  toggle(): void {
    this.isDark.update((current) => !current);
    localStorage.setItem(this.storageKey, this.isDark() ? "dark" : "light");
  }

  private initialPreference(): ThemePreference {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === "dark" || saved === "light") return saved;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
}
