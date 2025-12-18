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

// ---------------------------------------------------------------------
// 2) INSTANCIA AXIOS GENERAL (JSON / USO NORMAL)
// ---------------------------------------------------------------------

const api: AxiosInstance = axios.create({
  baseURL: BASE,
  timeout: 60000,
  // ⚠️ Si aquí existiera Content-Type: application/json,
  // NO lo tocamos. La función apiPostForm lo evita por completo.
});

// ---------------------------------------------------------------------
// 3) INTERCEPTOR (AUTENTICACIÓN)
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
// 4) FUNCIONES HTTP NORMALES (JSON)
// ---------------------------------------------------------------------

export const apiGet = <T>(url: string, params?: any): Promise<T> =>
  api.get<T>(url, { params }).then((r) => r.data);

export async function apiPost<T>(
  url: string,
  data?: any,
  config: any = {}
): Promise<T> {
  const res = await api.post(url, data, config);
  return res.data;
}

export async function apiPatch<T>(
  url: string,
  data?: any,
  config: any = {}
): Promise<T> {
  const res = await api.patch(url, data, config);
  return res.data;
}

export const apiPut = <T>(url: string, data?: any): Promise<T> =>
  api.put<T>(url, data).then((r) => r.data);

export const apiDelete = <T>(url: string): Promise<T> =>
  api.delete<T>(url).then((r) => r.data);

// ---------------------------------------------------------------------
// 5) 🚀 FUNCIÓN NUCLEAR PARA SUBIR FORMDATA (FOTOS)
// ---------------------------------------------------------------------

/**
 * 🚀 FUNCIÓN ESPECIAL PARA SUBIR FORMDATA (FOTOS)
 * - NO usa la instancia `api`
 * - NO hereda headers globales
 * - NO define Content-Type
 * - Deja que el navegador genere el boundary correcto
 */
export async function apiPostForm<T>(
  url: string,
  formData: FormData
): Promise<T> {
  const token = Cookies.get(TOKEN_KEY);

  const response = await axios.post(`${BASE}${url}`, formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // 🛑 JAMÁS poner Content-Type aquí
    },
    timeout: 60000,
  });

  return response.data;
}

// ---------------------------------------------------------------------
// 6) HELPER OPCIONAL DE UPLOAD (USA apiPostForm)
// ---------------------------------------------------------------------

export const apiUpload = async <T>(
  url: string,
  files: File[],
  fieldName = "files"
): Promise<T> => {
  const form = new FormData();
  files.forEach((f) => form.append(fieldName, f));

  return apiPostForm<T>(url, form);
};

export default api;
