"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPatch } from "@/lib/api"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from "lucide-react"; 

interface UserData {
  id: number;
  username: string;
  nombreCompleto: string; 
  role: string;
  active: boolean;
  email?: string;
  phone?: string;
  createdAt?: string;
}

export default function PerfilUsuario() {
  const [user, setUser] = useState<UserData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // 🚀 CORRECCIÓN: Declaración de estados de visibilidad de contraseña
  const [showPass, setShowPass] = useState(false); 
  const [showConfirm, setShowConfirm] = useState(false); 
  
  // === Estado de validaciones y formulario ===
  const [form, setForm] = useState({ 
    nombreCompleto: "", 
    email: "", 
    phone: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [validations, setValidations] = useState({
      passwordMatch: false,
      passwordStrength: 0,
  });


  // === Lógica para la carga inicial del usuario logueado ===
  useEffect(() => {
    const token = Cookies.get("svtec_token");
    if (token) {
      const decoded: any = jwtDecode(token);
      loadUser(decoded.sub); // Usamos el ID para la carga
    }
  }, []);

  const loadUser = async (userId: number) => {
    try {
      const data = await apiGet<UserData>(`/users/${userId}`);
setUser(data);

      setForm({
        nombreCompleto: data.nombreCompleto || "", 
        email: data.email || "",
        phone: data.phone || "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error cargando perfil:", error);
      toast.error("Error al cargar los datos del usuario");
    }
  };
  
  // === Validaciones de Contraseña (Lógica unificada) ===
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    return strength;
  };

  useEffect(() => {
    setValidations({
        passwordMatch: form.password === form.confirmPassword && form.password.length > 0,
        passwordStrength: calculatePasswordStrength(form.password),
    });
  }, [form.password, form.confirmPassword]);
  
  const getStrengthColor = () => {
    if (validations.passwordStrength <= 2) return "bg-red-500";
    if (validations.passwordStrength === 3) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  const getStrengthText = () => {
    if (validations.passwordStrength <= 2) return "Débil";
    if (validations.passwordStrength === 3) return "Media";
    return "Segura";
  };
  
  // === Validar antes de guardar ===
  const validateBeforeSave = () => {
      setErrorMsg("");
      if (!form.nombreCompleto || !form.email || !form.phone) {
          setErrorMsg("El nombre completo, correo y el teléfono son obligatorios.");
          return false;
      }
      
      if (form.password) {
          if (validations.passwordStrength < 3) {
              setErrorMsg("La nueva contraseña es demasiado débil.");
              return false;
          }
          if (!validations.passwordMatch) {
              setErrorMsg("Las contraseñas no coinciden.");
              return false;
          }
      }
      return true;
  }
  

  // === Guardar edición ===
  const handleSave = async () => {
    if (!user || !validateBeforeSave()) return;
    setLoading(true);

    try {
      const dataToSubmit: any = {
        nombreCompleto: form.nombreCompleto, 
        email: form.email,
        phone: form.phone,
      };
      
      if (form.password) {
        dataToSubmit.password = form.password;
      }
      
      await apiPatch(`/users/${user.id}`, dataToSubmit);
      
      toast.success("✅ Perfil actualizado correctamente");
      setEditOpen(false);
      loadUser(user.id);
      
    } catch (error) {
      console.error("Error actualizando perfil:", error);
      toast.error("No se pudo actualizar el perfil");
    } finally {
        setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "DIRECTOR": // 🚀 AÑADIDO
        return "bg-yellow-100 text-yellow-700";
      case "SUPERVISOR":
        return "bg-blue-100 text-blue-700";
      case "RESIDENTE":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
};

  if (!user) {
    return <div className="text-center mt-20 text-gray-500">Cargando perfil...</div>;
  }

  return (
    <main className="p-8 flex justify-center">
      <Card className="w-full max-w-2xl shadow-lg border"> 
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-[#0C2D57]">
            Perfil del Usuario
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#0C2D57] text-white text-2xl font-bold shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-800">{user.nombreCompleto}</p> 
              <Badge className={getRoleColor(user.role)}>
                {user.role}
              </Badge>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>Nombre de usuario:</strong> {user.username}
            </p>
            <p>
              <strong>Correo:</strong> {user.email || <span className="text-gray-400">No registrado</span>}
            </p>
            <p>
              <strong>Teléfono:</strong> {user.phone || <span className="text-gray-400">No registrado</span>}
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              <span className={user.active ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {user.active ? "Activo" : "Inactivo"}
              </span>
            </p>
            <p>
              <strong>Miembro desde:</strong>{" "}
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("es-CO")
                : "Sin fecha registrada"}
            </p>
          </div>

          <Separator />
          
          <div className="flex justify-end">
            <Button onClick={() => setEditOpen(true)} className="bg-[#0C2D57] hover:bg-[#113a84]">
              Editar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === Modal de edición (Unificado) === */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {/* Campo Nombre Completo */}
            <Input
              placeholder="Nombre Completo"
              value={form.nombreCompleto}
              required
              onChange={(e) => setForm({ ...form, nombreCompleto: e.target.value })}
            />
            {/* Correo y Teléfono (Precargados) */}
            <Input
              placeholder="Correo electrónico"
              value={form.email}
              type="email"
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              placeholder="Teléfono (10 dígitos)"
              value={form.phone}
              type="tel"
              required
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              pattern="[0-9]{10}"
            />
            
            {/* Contraseña */}
            <div className="relative">
              <Input
                placeholder="Contraseña (dejar vacío para no cambiar)"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
               {/* Barra de fuerza */}
              {form.password && (
                <div className="mt-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all duration-500`}
                      style={{
                        width: `${validations.passwordStrength * 20}%`,
                      }}
                    ></div>
                  </div>
                  <p
                    className={`text-xs mt-1 font-medium ${
                      getStrengthColor() === "bg-red-500"
                        ? "text-red-600"
                        : getStrengthColor() === "bg-yellow-500"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    Fortaleza: {getStrengthText()}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="relative">
              <Input
                placeholder="Confirmar contraseña"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                // Removí la validación de la clase aquí, el validador principal se encarga.
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}

            <Button onClick={handleSave} disabled={loading} className="mt-2 bg-[#0C2D57] hover:bg-[#113a84]">
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}