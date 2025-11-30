// lib/auth.ts
import Cookies from "js-cookie";

/**
 * Clave única para el almacenamiento local del token
 * (coincide con lo que otras partes de la app esperan leer).
 */
export const TOKEN_STORAGE_KEY = "token";

/**
 * Nombre de la cookie (usar variable pública en Next.js si existe).
 */
const COOKIE_NAME =
  (typeof process !== "undefined" &&
    (process as any).env &&
    ((process as any).env.NEXT_PUBLIC_AUTH_COOKIE_NAME ||
      (process as any).env.AUTH_COOKIE_NAME)) ||
  "svtec_token";

/**
 * Guarda el token en cookie **y** en localStorage para compatibilidad
 * con los módulos que lo leen desde localStorage.
 */
export function saveToken(token: string) {
  // Evitar fallos en SSR
  const isBrowser = typeof window !== "undefined";

  // 1) Cookie (1 día; segura si es https)
  Cookies.set(COOKIE_NAME, token, {
    expires: 1, // 1 día
    sameSite: "lax",
    secure: isBrowser ? window.location.protocol === "https:" : false,
    path: "/",
  });

  // 2) localStorage (para páginas que lo leen de ahí)
  if (isBrowser) {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // noop
    }
  }
}

/**
 * Obtiene el token desde cookie; si no está, intenta localStorage.
 */
export function getToken(): string | undefined {
  const cookieToken = Cookies.get(COOKIE_NAME);
  if (cookieToken) return cookieToken;

  if (typeof window !== "undefined") {
    try {
      const lsToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      return lsToken ?? undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Borra el token de cookie y de localStorage.
 */
export function clearToken() {
  Cookies.remove(COOKIE_NAME, { path: "/" });

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // noop
    }
  }
}
