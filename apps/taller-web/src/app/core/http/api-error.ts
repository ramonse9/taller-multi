import { HttpErrorResponse } from "@angular/common/http";

interface ApiErrorBody {
  message?: string | string[];
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body = error.error as ApiErrorBody | null;
  const message = body?.message;
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message.trim()) return message;
  if (error.status === 0) return "No fue posible conectar con el servidor.";
  return fallback;
}
