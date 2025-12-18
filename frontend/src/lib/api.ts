// 📄 frontend/src/lib/api.ts

import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

// ---------------------------------------------------------------------
// 1) CONFIGURACIÓN BASE
// ---------------------------------------------------------------------

const BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://localhost:3001";

const TOKEN_KEY =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "svtec_token";

// Instancia Axios base
const api: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: 60000, // 60s para Render
  // ⚠️ NO definir Content-Type aquí
});

// ---------------------------------------------------------------------
// 2) INTERCEPTOR (AUTENTICACIÓN)
// ---------------------------------------------------------------------

api.interceptors.request.use(
  (config) => {
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

export const apiGet = <T>(url: string, params?: any): Promise<T> =>
  api.get<T>(url, { params }).then((r) => r.data);

// ---------------------------------------------------------------------
// ✅ apiPost — CORREGIDO (FormData SAFE)
// ---------------------------------------------------------------------

export async function apiPost<T>(
  url: string,
  data?: any,
  config: any = {}
): Promise<T> {
  const token = Cookies.get(TOKEN_KEY);
  const isFormData = data instanceof FormData;

  const headers: any = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...config.headers,
  };

  // 🚨 CLAVE: si es FormData, NO tocar Content-Type
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const res = await api.post(url, data, {
    ...config,
    headers,
  });

  return res.data;
}

// ---------------------------------------------------------------------
// ❗ apiPut (no usado para FormData en tu flujo actual)
// ---------------------------------------------------------------------

export const apiPut = <T>(url: string, data?: any): Promise<T> =>
  api.put<T>(url, data).then((r) => r.data);

// ---------------------------------------------------------------------
// ✅ apiPatch — CORREGIDO (FormData SAFE)
// ---------------------------------------------------------------------

export async function apiPatch<T>(
  url: string,
  data?: any,
  config: any = {}
): Promise<T> {
  const token = Cookies.get(TOKEN_KEY);
  const isFormData = data instanceof FormData;

  const headers: any = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...config.headers,
  };

  // 🚨 MISMA REGLA AQUÍ
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const res = await api.patch(url, data, {
    ...config,
    headers,
  });

  return res.data;
}

// ---------------------------------------------------------------------

export const apiDelete = <T>(url: string): Promise<T> =>
  api.delete<T>(url).then((r) => r.data);

// ---------------------------------------------------------------------
// UPLOAD (helper opcional)
// ---------------------------------------------------------------------

export const apiUpload = <T>(
  url: string,
  files: File[],
  fieldName = "files"
): Promise<T> => {
  const form = new FormData();
  files.forEach((f) => form.append(fieldName, f));

  return api.post<T>(url, form).then((r) => r.data);
};

export default api;
