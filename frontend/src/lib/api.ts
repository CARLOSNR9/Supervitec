// 📄 frontend/src/lib/api.ts

import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

// ---------------------------------------------------------------------
// 1) CONFIGURACIÓN BASE
// ---------------------------------------------------------------------

// ✅ Usa variable de entorno si existe; si no, por defecto al backend en 3001
// Ej.: NEXT_PUBLIC_API_URL="http://localhost:3001"
const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:3001";

const TOKEN_KEY = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "svtec_token";

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------
// 2) INTERCEPTOR (AUTENTICACIÓN + EXCLUSIONES DE RUTAS)
// ---------------------------------------------------------------------

api.interceptors.request.use(
  (config) => {
    // Evitar adjuntar token en login/refresh
    // Soporta URLs relativas o absolutas
    const url = config.url || "";
    const fullUrl = url.startsWith("http") ? url : `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
    const { pathname } = new URL(fullUrl);

    const isAuthPath =
      pathname === "/auth/login" || pathname === "/auth/refresh" || pathname === "/auth/register";

    if (!isAuthPath) {
      // Evitar errores en SSR (Next.js)
      const tokenFromCookie = Cookies.get(TOKEN_KEY);
      const tokenFromStorage =
        typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

      const token = tokenFromCookie || tokenFromStorage;

      if (token) {
        // @ts-expect-error: Axios type for headers is broad; this is safe
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------
// 3) FUNCIONES HTTP
// ---------------------------------------------------------------------

export const apiGet = <T,>(url: string, params?: any): Promise<T> =>
  api.get<T>(url, { params }).then((r) => r.data);

export const apiPost = <T,>(url: string, data?: any): Promise<T> =>
  api.post<T>(url, data).then((r) => r.data);

export const apiPut = <T,>(url: string, data?: any): Promise<T> =>
  api.put<T>(url, data).then((r) => r.data);

export const apiPatch = <T,>(url: string, data?: any): Promise<T> =>
  api.patch<T>(url, data).then((r) => r.data);

export const apiDelete = <T,>(url: string): Promise<T> =>
  api.delete<T>(url).then((r) => r.data);

export const apiUpload = <T,>(
  url: string,
  files: File[],
  fieldName = "files"
): Promise<T> => {
  const form = new FormData();
  files.forEach((f) => form.append(fieldName, f));

  return api
    .post<T>(url, form, {
      // ⚠️ No fuerces Content-Type; deja que Axios ponga el boundary
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ---------------------------------------------------------------------
// 4) EXPORTAR INSTANCIA BASE
// ---------------------------------------------------------------------

export default api;
