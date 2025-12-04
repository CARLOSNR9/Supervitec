"use client";

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
import { LogOut, Settings, User } from "lucide-react";

// ✅ Definimos la interfaz para recibir los datos desde el Navbar padre
interface NavbarUserMenuProps {
  username: string;
  role: string;
}

// ✅ Recibimos username y role como props
export default function NavbarUserMenu({ username, role }: NavbarUserMenuProps) {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("svtec_token");
    // Forzamos un refresco completo o redirección
    window.location.href = "/login";
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
      case "DIRECTOR":
        return "Director";
      default:
        return "Usuario";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <div className="flex flex-col items-end">
          {/* Usamos las props directamente */}
          <span className="text-sm font-semibold text-white">{username}</span>
          <span className="text-[11px] text-gray-300">{formatRole(role)}</span>
        </div>
        <Avatar className="h-9 w-9 border-2 border-white shadow-md">
          <AvatarImage src="/user-avatar.png" alt={username} />
          <AvatarFallback className="bg-sky-700 text-white font-bold">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />

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