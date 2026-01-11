"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
// Agregamos ArrowUpDown, ArrowUp, ArrowDown para los iconos de ordenar
import { Eye, EyeOff, CheckCircle2, XCircle, Pencil, Trash2, User, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 🚀 Utility para asignar color según rol
const getRoleColorClass = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-700";
    case "DIRECTOR":
      return "bg-yellow-100 text-yellow-700";
    case "SUPERVISOR":
      return "bg-blue-100 text-blue-700";
    case "RESIDENTE":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // === ESTADO PARA EL ORDENAMIENTO ===
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });

  const [validations, setValidations] = useState({
    emailValid: false,
    phoneValid: false,
    passwordMatch: false,
    passwordStrength: 0,
  });

  const [form, setForm] = useState({
    username: "",
    nombreCompleto: "",
    password: "",
    confirmPassword: "",
    email: "",
    phone: "",
    role: "RESIDENTE",
    active: true,
    maxUsers: 0,
    maxObras: 0,
  });

  // ========= Obtener usuario actual & lista de usuarios ==========
  useEffect(() => {
    const load = async () => {
      try {
        const me = await apiGet("/auth/me");
        setCurrentUser(me);
      } catch (err) {
        console.error("No se pudo cargar el usuario actual", err);
      }

      fetchUsers();
    };
    load();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiGet<any[]>("/users");
      setUsers(res);
    } catch (err) {
      toast.error("Error al cargar los usuarios");
      console.error(err);
    }
  };

  // ==== LOGICA DE ORDENAMIENTO ====
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    // Si ya estamos ordenando por esta columna y es ascendente, cambiamos a descendente
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Creamos una copia ordenada de los usuarios para renderizar
  const sortedUsers = [...users].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const key = sortConfig.key;
    // Manejo seguro de valores nulos
    const valA = a[key] ? a[key].toString().toLowerCase() : "";
    const valB = b[key] ? b[key].toString().toLowerCase() : "";

    if (valA < valB) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Función auxiliar para mostrar el icono de ordenamiento en el encabezado
  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-gray-400" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-4 w-4 text-gray-800" />;
    return <ArrowDown className="ml-2 h-4 w-4 text-gray-800" />;
  };

  // ==== Password strength ====
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
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    const phoneRegex = /^\d{10}$/;

    setValidations({
      emailValid: emailRegex.test(form.email),
      phoneValid: phoneRegex.test(form.phone),
      passwordMatch:
        form.password === form.confirmPassword && form.password.length > 0,
      passwordStrength: calculatePasswordStrength(form.password),
    });
  }, [form]);

  // ==== Validación previa a guardar ====
  const validateBeforeSubmit = () => {
    if (!form.username || !form.nombreCompleto || !form.email || !form.phone) {
      setErrorMsg("Todos los campos son obligatorios.");
      return false;
    }

    if (!validations.emailValid) {
      setErrorMsg("Correo electrónico no válido.");
      return false;
    }

    if (!validations.phoneValid) {
      setErrorMsg("El número debe tener 10 dígitos.");
      return false;
    }

    if (!editingId && form.password.length === 0) {
      setErrorMsg("La contraseña es obligatoria al crear usuario.");
      return false;
    }

    if (form.password && validations.passwordStrength < 3) {
      setErrorMsg("La contraseña es demasiado débil.");
      return false;
    }

    if (form.password && !validations.passwordMatch) {
      setErrorMsg("Las contraseñas no coinciden.");
      return false;
    }

    if (
      currentUser?.role === "ADMIN" &&
      form.role === "DIRECTOR" &&
      (form.maxUsers < 1 || form.maxObras < 1)
    ) {
      setErrorMsg(
        "Para un Director debes indicar al menos 1 usuario y 1 obra permitida."
      );
      return false;
    }

    return true;
  };

  // ==== Crear o editar usuario ====
  const handleSubmit = async () => {
    setErrorMsg("");
    if (!validateBeforeSubmit()) return;

    try {
      if (editingId) {
        const dataToSubmit: any = {
          username: form.username,
          nombreCompleto: form.nombreCompleto,
          email: form.email,
          phone: form.phone,
          role: form.role,
          active: form.active,
          ...(form.password && { password: form.password }),
        };

        if (currentUser?.role === "ADMIN" && form.role === "DIRECTOR") {
          if (form.maxUsers > 0) dataToSubmit.maxUsers = form.maxUsers;
          if (form.maxObras > 0) dataToSubmit.maxObras = form.maxObras;
        }

        await apiPatch(`/users/${editingId}`, dataToSubmit);
        toast.success("Usuario actualizado correctamente");
      } else {
        const dataToSubmit: any = {
          username: form.username,
          nombreCompleto: form.nombreCompleto,
          password: form.password,
          email: form.email,
          phone: form.phone,
          role: form.role,
          active: form.active,
        };

        if (currentUser?.role === "ADMIN" && form.role === "DIRECTOR") {
          if (form.maxUsers > 0) dataToSubmit.maxUsers = form.maxUsers;
          if (form.maxObras > 0) dataToSubmit.maxObras = form.maxObras;
        }

        await apiPost("/users", dataToSubmit);
        toast.success("Usuario creado exitosamente");
      }

      setOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error("Error guardando usuario:", err);
      toast.error(err?.response?.data?.message || "No se pudo guardar el usuario");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Deseas eliminar este usuario?")) return;
    try {
      await apiDelete(`/users/${id}`);
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error("No se pudo eliminar el usuario");
    }
  };

  const handleEdit = async (user: any) => {
    try {
      const res = await apiGet<any>(`/users/${user.id}`);
      setForm({
        username: res.username || "",
        nombreCompleto: res.nombreCompleto || "",
        password: "",
        confirmPassword: "",
        email: res.email || "",
        phone: res.phone || "",
        role: res.role || "RESIDENTE",
        active: res.active,
        maxUsers: res.maxUsers ?? 0,
        maxObras: res.maxObras ?? 0,
      });

      setEditingId(res.id);
      setOpen(true);
    } catch (err) {
      console.error("Error al cargar usuario:", err);
      toast.error("No se pudo cargar la información del usuario");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setErrorMsg("");
    setShowPass(false);
    setShowConfirm(false);
    setForm({
      username: "",
      nombreCompleto: "",
      password: "",
      confirmPassword: "",
      email: "",
      phone: "",
      role: "RESIDENTE",
      active: true,
      maxUsers: 0,
      maxObras: 0,
    });
  };

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

  // =================== RENDER =======================
  return (
    // ✅ Padding responsivo
    <main className="p-4 md:p-8">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between mb-6 items-start md:items-center gap-4 md:gap-0">
        <h1 className="text-2xl font-semibold text-gray-700">Usuarios</h1>
        <Button
          className="w-full md:w-auto"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          + Nuevo Usuario
        </Button>
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS (Usamos sortedUsers también aquí para consistencia) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedUsers.map((u) => (
          <Card key={u.id} className="shadow-sm border border-gray-200">
            <CardHeader className="pb-2 flex flex-row justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{u.nombreCompleto || u.username}</h3>
                  <p className="text-xs text-gray-500">@{u.username}</p>
                </div>
              </div>
              <Badge className={`${getRoleColorClass(u.role)} border-0`}>
                {u.role}
              </Badge>
            </CardHeader>
            <CardContent className="pt-2 text-sm space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Estado:</span>
                {u.active ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Activo
                  </span>
                ) : (
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Inactivo
                  </span>
                )}
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-800 truncate max-w-[150px]">{u.email || "-"}</span>
              </div>
              <div className="flex justify-between py-1 pb-3">
                <span className="text-gray-500">Teléfono:</span>
                <span className="text-gray-800">{u.phone || "-"}</span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEdit(u)}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDelete(u.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 💻 VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              {/* ENCABEZADOS CON CLICK PARA ORDENAR */}
              <th 
                className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('username')}
              >
                <div className="flex items-center">
                  Usuario {renderSortIcon('username')}
                </div>
              </th>
              
              <th 
                className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('nombreCompleto')}
              >
                <div className="flex items-center">
                  Nombre Completo {renderSortIcon('nombreCompleto')}
                </div>
              </th>

              <th 
                className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  Correo {renderSortIcon('email')}
                </div>
              </th>

              <th 
                className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('phone')}
              >
                <div className="flex items-center">
                  Teléfono {renderSortIcon('phone')}
                </div>
              </th>

              <th 
                className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  Rol {renderSortIcon('role')}
                </div>
              </th>

              <th 
                className="p-3 font-medium cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleSort('active')}
              >
                <div className="flex items-center">
                  Activo {renderSortIcon('active')}
                </div>
              </th>

              <th className="p-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {/* Renderizamos sortedUsers en lugar de users */}
            {sortedUsers.map((u) => (
              <tr
                key={u.id}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3">{u.nombreCompleto || u.username}</td>
                <td className="p-3">{u.email || "-"}</td>
                <td className="p-3">{u.phone || "-"}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold ${getRoleColorClass(
                      u.role
                    )}`}
                  >
                    {u.role}
                  </span>
                </td>

                <td className="p-3">
                  {u.active ? (
                    <span className="text-green-600 font-medium">Sí</span>
                  ) : (
                    <span className="text-gray-400 font-medium">No</span>
                  )}
                </td>

                <td className="p-3 text-right flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(u)}>
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(u.id)}
                  >
                    🗑️ Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL (Funciona igual en ambos) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90%] md:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar usuario" : "Registrar usuario"}
            </DialogTitle>
            <DialogDescription>
              Completa los campos para{" "}
              {editingId ? "actualizar este usuario" : "crear un nuevo usuario"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto px-1">
            <Input
              placeholder="Usuario"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <Input
              placeholder="Nombre Completo"
              value={form.nombreCompleto}
              onChange={(e) =>
                setForm({ ...form, nombreCompleto: e.target.value })
              }
            />

            {/* CORREO */}
            <div className="relative">
              <Input
                placeholder="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`${
                  form.email.length > 0 &&
                  (validations.emailValid
                    ? "border-green-400"
                    : "border-red-400")
                }`}
              />
              {form.email.length > 0 && (
                <div className="absolute right-3 top-3">
                  {validations.emailValid ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* TELÉFONO */}
            <div className="relative">
              <Input
                placeholder="Teléfono (10 dígitos)"
                type="tel"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`${
                  form.phone.length > 0 &&
                  (validations.phoneValid
                    ? "border-green-400"
                    : "border-red-400")
                }`}
              />

              {form.phone.length > 0 && (
                <div className="absolute right-3 top-3">
                  {validations.phoneValid ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <XCircle size={18} className="text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Input
                placeholder={editingId ? "Contraseña (opcional)" : "Contraseña"}
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
              />

              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>

              {form.password && (
                <div className="mt-1">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className={`h-full ${getStrengthColor()} transition-all`}
                      style={{
                        width: `${validations.passwordStrength * 20}%`,
                      }}
                    ></div>
                  </div>

                  <p className="text-xs mt-1 font-medium">
                    Fortaleza: {getStrengthText()}
                  </p>
                </div>
              )}
            </div>

            {/* CONFIRMAR PASSWORD */}
            <div className="relative">
              <Input
                placeholder="Confirmar contraseña"
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                required={!editingId && form.password.length > 0}
                className={`${
                  form.confirmPassword.length > 0 &&
                  (validations.passwordMatch
                    ? "border-green-400"
                    : "border-red-400")
                }`}
              />

              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* SELECT DE ROLES */}
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona rol" />
              </SelectTrigger>

              <SelectContent>
                {currentUser?.role === "ADMIN" && (
                  <>
                    <SelectItem value="ADMIN">🟥 Admin</SelectItem>
                    <SelectItem value="DIRECTOR">🟨 Director</SelectItem>
                    <SelectItem value="SUPERVISOR">🟦 Supervisor</SelectItem>
                    <SelectItem value="RESIDENTE">🟩 Residente</SelectItem>
                    <SelectItem value="VISITANTE">⚪ Visitante</SelectItem>
                  </>
                )}

                {currentUser?.role === "DIRECTOR" && (
                  <>
                    <SelectItem value="SUPERVISOR">🟦 Supervisor</SelectItem>
                    <SelectItem value="RESIDENTE">🟩 Residente</SelectItem>
                    <SelectItem value="VISITANTE">⚪ Visitante</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            {/* 🔹 BLOQUE NUEVO: SOLO ADMIN creando/edita DIRECTOR */}
            {currentUser?.role === "ADMIN" && form.role === "DIRECTOR" && (
              <>
                <Input
                  type="number"
                  placeholder="Máximo de usuarios permitidos"
                  value={form.maxUsers || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxUsers: Number(e.target.value),
                    })
                  }
                />

                <Input
                  type="number"
                  placeholder="Máximo de obras permitidas"
                  value={form.maxObras || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxObras: Number(e.target.value),
                    })
                  }
                />
              </>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => {
                  const msg = v
                    ? "¿Deseas activar este usuario?"
                    : "¿Deseas desactivar este usuario? No podrá iniciar sesión.";
                  if (confirm(msg)) setForm({ ...form, active: v });
                }}
              />
              <span className="text-sm">Activo</span>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}

            <Button
              onClick={handleSubmit}
              className="mt-2 bg-[#0C2D57] text-white hover:bg-[#103c7c]"
            >
              {editingId ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}