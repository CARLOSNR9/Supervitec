// 📄 frontend/src/lib/api.ts

import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

// ---------------------------------------------------------------------
// 1) CONFIGURACIÓN BASE
// ---------------------------------------------------------------------

// Usa variable NEXT_PUBLIC_API_URL sin barras dobles
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
    // Soporta URLs relativas y absolutas
    const url = config.url || "";
    const fullUrl = url.startsWith("http")
      ? url
      : `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;

    const { pathname } = new URL(fullUrl);

    const isAuthPath =
      pathname === "/auth/login" ||
      pathname === "/auth/refresh" ||
      pathname === "/auth/register";

    if (!isAuthPath) {
      const tokenFromCookie = Cookies.get(TOKEN_KEY);
      const tokenFromStorage =
        typeof window !== "undefined"
          ? localStorage.getItem(TOKEN_KEY)
          : null;

      const token = tokenFromCookie || tokenFromStorage;

      if (token) {
        // @ts-expect-error — axios types are too strict, but safe
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

// ---------------------------------------------------------------------
// ✅ NUEVO apiPatch — PERMITIENDO HEADERS PERSONALIZADOS (FORM-DATA ETC.)
// ---------------------------------------------------------------------

export async function apiPatch<T>(
  url: string,
  data?: any,
  config: any = {}
): Promise<T> {
  const token = Cookies.get(TOKEN_KEY);

  const headers = {
    ...(config.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return api
    .patch(url, data, {
      ...config,
      headers,
    })
    .then((res) => res.data);
}

// ---------------------------------------------------------------------

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
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
};

// ---------------------------------------------------------------------
// 4) EXPORTAR INSTANCIA BASE
// ---------------------------------------------------------------------

export default api;
