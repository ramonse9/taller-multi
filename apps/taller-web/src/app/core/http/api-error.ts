import { HttpErrorResponse } from "@angular/common/http";

interface ApiErrorBody {
  message?: string | string[];
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body = error.error as ApiErrorBody | null;
  const message = body?.message;
  const normalized = Array.isArray(message) ? message.join(" ") : message;
  if (
    error.status === 403 &&
    typeof normalized === "string" &&
    /^(Permiso requerido:|Permisos insuficientes|Se requiere al menos uno de estos permisos:)/i.test(
      normalized.trim(),
    )
  ) {
    return "Tu cuenta no tiene habilitado el permiso necesario para esta acción. Solicita a quien administre usuarios que revise tus permisos.";
  }
  if (typeof normalized === "string" && normalized.trim()) return normalized;
  if (error.status === 0) return "No fue posible conectar con el servidor.";
  return fallback;
}
