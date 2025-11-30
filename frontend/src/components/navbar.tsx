"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import NavbarUserMenu from "./navbar-user-menu";
import { Button } from "@/components/ui/button";

interface User {
  username: string;
  role: string;
  sub: number;
}

interface MenuItem {
  name: string;
  path: string;
  requiredRole: keyof typeof roleRank;
}

// 🔢 Ranking de roles (de menor a mayor privilegio)
const roleRank = {
  VISITANTE: 0,
  RESIDENTE: 1,
  SUPERVISOR: 2,
  DIRECTOR: 3,
  ADMIN: 4,
} as const;

// =======================================================
// 🔹 MENÚ CONFIGURABLE SEGÚN ROL
// =======================================================
const getMenuItems = (role: string): MenuItem[] => {
  const allItems: MenuItem[] = [
    // 🔸 Secciones generales (desde RESIDENTE hacia arriba)
    { name: "Dashboard", path: "/dashboard", requiredRole: "RESIDENTE" },
    { name: "Bitácoras", path: "/bitacoras", requiredRole: "RESIDENTE" },
    {
      name: "Órdenes de Trabajo",
      path: "/orden-trabajo",
      requiredRole: "RESIDENTE",
    },
    { name: "Obras", path: "/obras", requiredRole: "RESIDENTE" },
    { name: "Contratistas", path: "/contratistas", requiredRole: "RESIDENTE" },

    // 🔐 Catálogos solo para ADMIN
    { name: "Variables", path: "/variables", requiredRole: "ADMIN" },
    { name: "Mediciones", path: "/mediciones", requiredRole: "ADMIN" },
    { name: "Unidades", path: "/unidades", requiredRole: "ADMIN" },

    // 👥 Usuarios: DIRECTOR y ADMIN
    // (requiredRole = DIRECTOR → también lo ve ADMIN por jerarquía)
    { name: "Usuarios", path: "/usuarios", requiredRole: "DIRECTOR" },
  ];

  const userRank = roleRank[role as keyof typeof roleRank] ?? -1;

  const isAllowed = (itemRole: keyof typeof roleRank) => {
    const required = roleRank[itemRole];
    return userRank >= required;
  };

  return allItems.filter((item) => isAllowed(item.requiredRole));
};

// =======================================================
// 🔹 COMPONENTE PRINCIPAL NAVBAR
// =======================================================
export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = Cookies.get("svtec_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        Cookies.remove("svtec_token");
        setUser(null);
      }
    }
  }, []);

  const menuItems = user ? getMenuItems(user.role) : [];

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-[#0C2D57] text-white shadow-md sticky top-0 z-50">
      {/* Logo y Nombre */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-lg tracking-wide">
          SuperviTEC PRO
        </span>
      </div>

      {/* Menú central */}
      <div className="flex items-center gap-6 text-sm">
        {menuItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">
              {item.name}
            </span>
          </Link>
        ))}
      </div>

      {/* Menú de Usuario (Perfil/Logout) */}
      <div className="relative">
        {user ? (
          <NavbarUserMenu username={user.username} role={user.role} />
        ) : (
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-[#0C2D57] hover:bg-gray-100"
            >
              Iniciar Sesión
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
