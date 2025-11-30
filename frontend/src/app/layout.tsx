// Archivo: frontend/src/app/layout.tsx (LAYOUT RAÍZ - CORREGIDO)

import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google'; 
import "./globals.css"; // Importación de estilos globales

// 1. Definición de la Fuente
const inter = Inter({ subsets: ['latin'] }); 

// 2. Definición de Metadatos
export const metadata: Metadata = {
  title: "SuperviTEC PRO",
  description: "Plataforma de Supervisión Técnica y Control Documental de Obra",
};

// 3. El componente DEBE llamarse RootLayout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 🚀 CORRECCIÓN CLAVE 1: Debe incluir <html>.
    <html lang="es">
      {/* 🚀 CORRECCIÓN CLAVE 2: Debe incluir <body>. */}
      {/* Aplicamos las clases de fuente y fondo AQUÍ. Esto resuelve los errores de hidratación. */}
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        {/* Solo se renderiza 'children'. Los componentes de UI (Navbar, Toaster) van en el layout anidado. */}
        {children}
      </body>
    </html>
  );
}