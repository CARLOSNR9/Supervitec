"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { jwtDecode } from "jwt-decode";
import { LogOut, Settings, User } from "lucide-react";

interface UserPayload {
  username: string;
  role: string;
}

export default function NavbarUserMenu() {
  const [user, setUser] = useState<UserPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = Cookies.get("svtec_token");
      if (token) {
        const decoded: any = jwtDecode(token);
        setUser({ username: decoded.username, role: decoded.role });
      }
    } catch (err) {
      console.error("Error al decodificar token:", err);
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("svtec_token");
    setUser(null);
    router.push("/login");
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrador";
      case "SUPERVISOR":
        return "Supervisor";
      case "RESIDENTE":
        return "Residente";
      case "VISITANTE":
        return "Visitante";
      default:
        return "Usuario";
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-white">{user.username}</span>
          <span className="text-[11px] text-gray-300">{formatRole(user.role)}</span>
        </div>
        <Avatar className="h-9 w-9 border-2 border-white shadow-md">
          <AvatarImage src="/user-avatar.png" alt={user.username} />
          <AvatarFallback className="bg-sky-700 text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* ✅ Redirecciones actualizadas */}
        <DropdownMenuItem
          onClick={() => router.push("/perfil")}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" /> Perfil
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => router.push("/configuracion")}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" /> Configuración
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 font-semibold"
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
