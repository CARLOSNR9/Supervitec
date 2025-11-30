import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtDecode } from "jwt-decode"; // ✅ import correcto

export function middleware(req: NextRequest) {
  const token = req.cookies.get("svtec_token")?.value;
  const { pathname } = req.nextUrl;

  const isPublicRoute = pathname.startsWith("/login");

  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    try {
      const decoded: any = jwtDecode(token);

      // Puedes aplicar control de acceso según el rol aquí
      // Ejemplo: si un VISITANTE intenta acceder a /usuarios, redirigirlo
      if (decoded.role === "VISITANTE" && pathname.startsWith("/usuarios")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

    } catch (error) {
      console.error("Token inválido o expirado:", error);
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete("svtec_token");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo-supervitec.png).*)"],
};
