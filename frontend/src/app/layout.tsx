// Archivo: frontend/src/app/layout.tsx (LAYOUT RAÍZ - FINAL)

import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter } from 'next/font/google'; 
import "./globals.css"; 
// 👇 1. IMPORTAMOS LOS PROVIDERS
import Providers from "@/components/providers"; 

const inter = Inter({ subsets: ['latin'] }); 

export const metadata: Metadata = {
  title: "SuperviTEC PRO",
  description: "Plataforma de Supervisión Técnica y Control Documental de Obra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen`}>
        {/* 👇 2. ENVOLVEMOS TODA LA APP CON PROVIDERS */}
        {/* Esto inyecta React Query y el Toaster en toda la aplicación */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}