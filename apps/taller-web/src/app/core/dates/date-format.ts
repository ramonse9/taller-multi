const shortDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatShortDate(value: string | Date | null | undefined): string {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : shortDateFormatter.format(date);
}
