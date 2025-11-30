"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveToken } from "@/lib/auth"; 
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  // 🚀 CAMBIO CLAVE: Nuevo estado para el mensaje de error en el banner
  const [bannerError, setBannerError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Limpiamos el error al intentar un nuevo login
    setBannerError(null); 

    try {
      const res = await apiPost<{ access_token: string }>("/auth/login", form);
      
      saveToken(res.access_token); 
      
      toast.success("✅ Inicio de sesión exitoso");
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Error en login:", error);

      const backendMessage = error?.response?.data?.message;
      let displayMessage = "Error desconocido en el inicio de sesión";
      let bannerText = "Error desconocido en el inicio de sesión"; // Mensaje que se mostrará en el banner

      if (backendMessage) {
          if (backendMessage.includes("inactiva")) {
              bannerText = "🚫 Tu cuenta está inactiva. Contacta al administrador.";
          } else if (backendMessage.includes("incorrecta")) {
              bannerText = "❌ Contraseña incorrecta. Intenta de nuevo.";
          } else if (backendMessage.includes("no encontrado")) {
              bannerText = "⚠️ Usuario no encontrado.";
          } else {
              bannerText = backendMessage; // Mensaje genérico o de otra excepción
          }
      }
      
      // 🚀 CAMBIO 1: Establecer el error para mostrarlo en el banner
      setBannerError(bannerText); 
      
      // 🚀 CAMBIO 2: Mostrar el error también en el toast para consistencia visual
      toast.error(bannerText);
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        // 🚀 CAMBIO 3: Estilos para el banner (rounded-xl y relative)
        className="bg-white p-8 rounded-xl shadow-md w-96 relative"
      >
        {/* 🔴 Banner de error (fijo sobre el formulario) */}
        {bannerError && (
          <div className="absolute -top-12 left-0 right-0 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-t-md text-sm text-center animate-fade-in">
            {bannerError}
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-center text-[#0C2D57] mb-6">
          SuperviTEC PRO
        </h1>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Usuario"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />

          <Input
            placeholder="Contraseña"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 w-full bg-[#0C2D57] text-white hover:bg-[#103c7c]"
          >
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-4">
          © {new Date().getFullYear()} SuperviTEC PRO — Todos los derechos reservados
        </p>
      </form>

      {/* 🚀 CAMBIO 4: Estilos JSX para la animación del banner */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}