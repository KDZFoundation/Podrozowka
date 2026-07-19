import { supabase } from "@/integrations/supabase/client";

export interface UploadErrorInfo {
  title: string;
  description: string;
  category: "auth" | "rls" | "size" | "type" | "path" | "network" | "unknown";
}

/**
 * Diagnose a Supabase Storage upload error and return a human-readable
 * category + description so admins can immediately tell whether the issue
 * is RLS, path, auth, file type/size, or something else.
 */
export function diagnoseUploadError(
  error: unknown,
  ctx: { bucket: string; path: string; file?: File | null }
): UploadErrorInfo {
  const errObj = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const raw = String(errObj?.message || errObj?.error || String(error));
  const status = errObj?.statusCode || errObj?.status;
  const lower = String(raw).toLowerCase();

  // Log full context for the developer console
  console.error("[upload] failed", {
    bucket: ctx.bucket,
    path: ctx.path,
    fileName: ctx.file?.name,
    fileType: ctx.file?.type,
    fileSizeKB: ctx.file ? Math.round(ctx.file.size / 1024) : undefined,
    status,
    raw,
    error,
  });

  if (lower.includes("row-level security") || lower.includes("rls") || lower.includes("violates row-level")) {
    return {
      category: "rls",
      title: "Brak uprawnień (RLS)",
      description: `Polityka storage.objects odrzuciła zapis do "${ctx.bucket}/${ctx.path}". Sprawdź, czy jesteś zalogowany jako admin i czy polityka INSERT używa has_role(auth.uid(), 'admin').`,
    };
  }
  if (lower.includes("jwt") || lower.includes("not authenticated") || status === 401) {
    return {
      category: "auth",
      title: "Sesja wygasła",
      description: "Wyloguj się i zaloguj ponownie — brak ważnego tokenu auth przy uploadzie.",
    };
  }
  if (lower.includes("payload too large") || lower.includes("exceeded") || status === 413) {
    return {
      category: "size",
      title: "Plik za duży",
      description: `Bucket "${ctx.bucket}" odrzucił plik ze względu na rozmiar (${
        ctx.file ? Math.round(ctx.file.size / 1024) + " KB" : "?"
      }).`,
    };
  }
  if (lower.includes("mime") || lower.includes("content-type")) {
    return {
      category: "type",
      title: "Nieobsługiwany format pliku",
      description: `Typ ${ctx.file?.type || "?"} nie jest dozwolony w buckecie "${ctx.bucket}".`,
    };
  }
  if (lower.includes("duplicate") || lower.includes("already exists")) {
    return {
      category: "path",
      title: "Konflikt ścieżki",
      description: `Plik "${ctx.path}" już istnieje. Włącz upsert lub zmień nazwę.`,
    };
  }
  if (lower.includes("invalid key") || lower.includes("path")) {
    return {
      category: "path",
      title: "Nieprawidłowa ścieżka",
      description: `Ścieżka "${ctx.path}" jest niedozwolona w buckecie "${ctx.bucket}".`,
    };
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return {
      category: "network",
      title: "Błąd sieci",
      description: "Nie udało się połączyć z serwerem. Sprawdź połączenie i spróbuj ponownie.",
    };
  }

  return {
    category: "unknown",
    title: "Nieznany błąd uploadu",
    description: `${raw}${status ? ` (status ${status})` : ""} — ścieżka: ${ctx.bucket}/${ctx.path}`,
  };
}

/**
 * Log upload attempt context so admins can see path & auth state in the console
 * before the request is sent.
 */
export async function logUploadAttempt(ctx: {
  bucket: string;
  path: string;
  file: File;
  extra?: Record<string, unknown>;
}) {
  const { data } = await supabase.auth.getUser();
  console.info("[upload] attempt", {
    bucket: ctx.bucket,
    path: ctx.path,
    fileName: ctx.file.name,
    fileType: ctx.file.type,
    fileSizeKB: Math.round(ctx.file.size / 1024),
    userId: data.user?.id,
    userEmail: data.user?.email,
    ...ctx.extra,
  });
}
