"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import NavbarUserMenu from "./navbar-user-menu";
import { Button } from "@/components/ui/button";
import { Menu, X, FileText } from "lucide-react"; // Agregamos FileText

interface User {
  username: string;
  role: string;
  sub: number;
}

interface MenuItem {
  name: string;
  path: string;
  requiredRole: keyof typeof roleRank;
  icon?: React.ReactNode; // Propiedad opcional para íconos
}

// 🔢 Ranking de roles
const roleRank = {
  VISITANTE: 0,
  RESIDENTE: 1,
  SUPERVISOR: 2,
  DIRECTOR: 3,
  ADMIN: 4,
} as const;

// =======================================================
// 🔹 MENÚ CONFIGURABLE
// =======================================================
const getMenuItems = (role: string): MenuItem[] => {
  const allItems: MenuItem[] = [
    { name: "Dashboard", path: "/dashboard", requiredRole: "RESIDENTE" },
    { name: "Bitácoras", path: "/bitacoras", requiredRole: "RESIDENTE" },
    
    // ✅ AQUÍ ESTÁ EL NUEVO ENLACE A INFORMES
    { 
      name: "Informes", 
      path: "/bitacoras/informes", 
      requiredRole: "RESIDENTE",
      icon: <FileText className="h-4 w-4 inline-block mr-1 mb-0.5" /> 
    },

    { name: "Órdenes de Trabajo", path: "/orden-trabajo", requiredRole: "RESIDENTE" },
    { name: "Obras", path: "/obras", requiredRole: "RESIDENTE" },
    { name: "Contratistas", path: "/contratistas", requiredRole: "RESIDENTE" },
    { name: "Variables", path: "/variables", requiredRole: "ADMIN" },
    { name: "Mediciones", path: "/mediciones", requiredRole: "ADMIN" },
    { name: "Unidades", path: "/unidades", requiredRole: "ADMIN" },
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
// 🔹 COMPONENTE NAVBAR
// =======================================================
export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <nav className="bg-[#0C2D57] text-white shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:px-6 py-3">
        
        {/* 1. IZQUIERDA: Logo y Botón Móvil */}
        <div className="flex items-center gap-3">
          {/* Botón Hamburguesa */}
          <button 
            className="md:hidden focus:outline-none" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <span className="font-bold text-lg tracking-wide truncate">
            SuperviTEC PRO
          </span>
        </div>

        {/* 2. CENTRO: Menú Escritorio */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {menuItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <span className={`hover:text-gray-300 transition-colors cursor-pointer font-medium flex items-center gap-1 ${item.name === 'Informes' ? 'text-blue-200' : ''}`}>
                {item.icon && item.icon}
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        {/* 3. DERECHA: Usuario */}
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
                Ingresar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 4. MENÚ DESPLEGABLE MÓVIL */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#092344] border-t border-[#1e457a]">
          <div className="flex flex-col p-4 space-y-3">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)} 
              >
                <span className="flex items-center gap-2 px-4 py-2 hover:bg-[#0C2D57] rounded-md transition-colors text-sm font-medium">
                  {item.icon && item.icon}
                  {item.name}
                </span>
              </Link>
            ))}
            {menuItems.length === 0 && (
              <p className="text-gray-400 text-xs px-4">No tienes permisos asignados.</p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}