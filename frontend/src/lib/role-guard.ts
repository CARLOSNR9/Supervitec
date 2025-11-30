import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export function getUserRole(): string | null {
  try {
    const token = Cookies.get("svtec_token");
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded.role;
  } catch {
    return null;
  }
}

export function hasAccess(allowedRoles: string[]): boolean {
  const role = getUserRole();
  return role ? allowedRoles.includes(role) : false;
}
