"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

type TokenPayload = {
  username: string;
  role: string;
  sub: number;
  exp: number; // seconds since epoch
};

function base64UrlDecode(input: string): string {
  // Convierte base64url a base64 estándar
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  // atob -> UTF-8
  const bin = typeof window !== "undefined" ? atob(str) : Buffer.from(str, "base64").toString("binary");
  // Decodifica correctamente UTF-8
  try {
    return decodeURIComponent(
      Array.prototype.map
        .call(bin, (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch {
    return bin;
  }
}

function decodeJwt<T = any>(token: string): T {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Token inválido");
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  return payload as T;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get("svtec_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const payload = decodeJwt<TokenPayload>(token);
      if (!payload?.exp || payload.exp * 1000 < Date.now()) {
        Cookies.remove("svtec_token");
        router.push("/login");
        return;
      }
      setAuthorized(true);
    } catch {
      Cookies.remove("svtec_token");
      router.push("/login");
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-gray-600">
        Verificando acceso…
      </div>
    );
  }

  return <>{children}</>;
}
