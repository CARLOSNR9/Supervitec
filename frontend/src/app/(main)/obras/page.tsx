"use client";

import { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Pencil, Trash2, Construction, Users, Check } from "lucide-react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------
// TIPOS Y ESTADOS
// ---------------------------------------------------------------------

interface Responsable {
  id: number;
  nombreCompleto: string;
  username: string;
  role: string;
}

interface Obra {
  id: number;
  prefijo: string;
  nombre: string;
  observaciones?: string;
  estado?: "PENDIENTE" | "EN_PROGRESO" | "FINALIZADA" | null;
  createdAt: string;
  creatorId: number;
  responsables: Responsable[];
}

interface FormState {
  prefijo: string;
  nombre: string;
  observaciones: string;
  responsablesId: number[];
}

const initialFormState: FormState = {
  prefijo: "",
  nombre: "",
  observaciones: "",
  responsablesId: [],
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [users, setUsers] = useState<Responsable[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<FormState>(initialFormState);
  
  // Estado del usuario actual
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<Responsable | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  // ---------------------------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------------------------

  useEffect(() => {
    const token = Cookies.get("svtec_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUserId(decoded.sub || decoded.id);
        setCurrentUserRole(decoded.role);
      } catch (e) {
        console.error("Error decodificando token", e);
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Obras
      const obrasRes = await apiGet<Obra[]>("/obras");
      setObras(obrasRes);

      // 2. Cargar Usuarios (Solo si es Admin o Director)
      const token = Cookies.get("svtec_token");
      let role = "";
      if (token) {
         const decoded: any = jwtDecode(token);
         role = decoded.role;
      }

      if (role === "ADMIN" || role === "DIRECTOR") {
        // A) Traer empleados (Endpoint /users)
        let empleados: any[] = [];
        try {
          empleados = await apiGet<any[]>("/users");
        } catch (error) {
          console.error("Error cargando empleados:", error);
        }

        // B) Traer datos de MI MISMO (El Director/Admin actual)
        let yo: any = null;
        try {
          yo = await apiGet<any>("/auth/me");
          if (yo) {
             setCurrentUserData({
                 id: yo.id,
                 username: yo.username,
                 nombreCompleto: yo.nombreCompleto || yo.username,
                 role: yo.role
             });
          }
        } catch (error) {
          console.error("Error cargando perfil propio:", error);
        }

        // C) UNIR LISTAS (Yo + Empleados) asegurando no duplicados por ID
        const mapaUsuarios = new Map();

        // Primero me agrego a mí mismo (Prioridad)
        if (yo && yo.active) {
          mapaUsuarios.set(yo.id, yo);
        }

        // Luego agrego a los empleados
        if (Array.isArray(empleados)) {
          empleados.forEach((emp) => {
            if (emp.active) {
                mapaUsuarios.set(emp.id, emp);
            }
          });
        }

        const todos = Array.from(mapaUsuarios.values());

        // D) FILTRAR POR ROL (Permitir Director, Supervisor y Residente)
        const rolesPermitidos = ["DIRECTOR", "SUPERVISOR", "RESIDENTE"];
        
        const usuariosFiltrados = todos
            .filter(u => rolesPermitidos.includes(u.role))
            .map(u => ({
                id: u.id,
                nombreCompleto: u.nombreCompleto || u.username,
                username: u.username,
                role: u.role
            }));

        setUsers(usuariosFiltrados);
        
        console.log("Usuarios cargados para el select:", usuariosFiltrados);
      }

    } catch (err) {
      console.error(err);
      toast.error("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // LÓGICA DE FILTRADO VISUAL (PARA LA TABLA DE OBRAS)
  // ---------------------------------------------------------------------

  const filteredObras = useMemo(() => {
    let filtered = obras;

    // Filtro por texto
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (obra) =>
          obra.nombre.toLowerCase().includes(lower) ||
          obra.prefijo.toLowerCase().includes(lower)
      );
    }

    // Filtro por Rol (Si no es Admin, solo ve lo suyo)
    if (currentUserRole !== "ADMIN" && currentUserId) {
      filtered = filtered.filter(
        (obra) =>
          obra.creatorId === currentUserId ||
          obra.responsables.some((resp) => resp.id === currentUserId)
      );
    }

    return filtered;
  }, [obras, currentUserRole, currentUserId, searchTerm]);

  // ---------------------------------------------------------------------
  // FORMULARIO
  // ---------------------------------------------------------------------

  const handleOpenRegister = () => {
    setErrorMsg("");
    setEditingId(null);
    // Al abrir, por defecto me selecciono a mí mismo si soy válido
    if (currentUserId && users.find(u => u.id === currentUserId)) {
      setForm({ ...initialFormState, responsablesId: [currentUserId] });
    } else {
      setForm(initialFormState);
    }
    setOpen(true);
  };

  const handleOpenEdit = async (obra: Obra) => {
    setErrorMsg("");
    setEditingId(obra.id);
    setLoading(true);

    try {
      const res = await apiGet<Obra>(`/obras/${obra.id}`);
      setForm({
        prefijo: res.prefijo,
        nombre: res.nombre,
        observaciones: res.observaciones || "",
        responsablesId: res.responsables.map((r) => r.id),
      });
      setOpen(true);
    } catch (err) {
      toast.error("Error al cargar obra.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!form.prefijo || !form.nombre || form.responsablesId.length === 0) {
      setErrorMsg("Debes completar Prefijo, Nombre y asignar al menos un Responsable.");
      return;
    }

    const payload = {
      prefijo: form.prefijo,
      nombre: form.nombre,
      responsablesId: form.responsablesId,
      observaciones: form.observaciones || null,
    };

    try {
      if (editingId) {
        await apiPatch(`/obras/${editingId}`, payload);
        toast.success("Obra actualizada.");
      } else {
        await apiPost("/obras", payload);
        toast.success("Obra creada.");
      }
      setOpen(false);
      fetchData(); // Recargar lista
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Error al guardar.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta obra?")) return;
    try {
      await apiDelete(`/obras/${id}`);
      toast.success("Obra eliminada.");
      fetchData();
    } catch (err) {
      toast.error("No se pudo eliminar.");
    }
  };

  // Helpers visuales
  const getStatusColor = (estado?: string | null) => {
    if (estado === "FINALIZADA") return "bg-green-100 text-green-700";
    if (estado === "EN_PROGRESO") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  }

  const formatResponsables = (list: Responsable[]) => {
    if (!list || list.length === 0) return "-";
    const names = list.map(r => r.nombreCompleto || r.username);
    return names.join(", ");
  };

  // ---------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------
  return (
    <main className="p-4 md:p-8">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0C2D57]">Obras</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData} title="Recargar">
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          {(currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR") && (
            <Button onClick={handleOpenRegister} className="bg-[#0C2D57]">
              + Nueva Obra
            </Button>
          )}
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="mb-6 relative max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
         <Input 
           placeholder="Buscar obra..." 
           className="pl-9"
           value={searchTerm}
           onChange={e => setSearchTerm(e.target.value)}
         />
      </div>

      {/* LISTADO (CARD MOBILE / TABLE DESKTOP) */}
      <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
             <tr>
               <th className="p-3">ID</th>
               <th className="p-3">Prefijo</th>
               <th className="p-3">Nombre</th>
               <th className="p-3">Estado</th>
               <th className="p-3">Responsables</th>
               <th className="p-3 text-right">Acciones</th>
             </tr>
          </thead>
          <tbody>
            {filteredObras.length === 0 ? (
               <tr><td colSpan={6} className="p-8 text-center text-gray-500">Sin obras.</td></tr>
            ) : (
               filteredObras.map(o => (
                 <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-600">#{o.id}</td>
                    <td className="p-3"><Badge variant="outline">{o.prefijo}</Badge></td>
                    <td className="p-3 font-medium">{o.nombre}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(o.estado)}`}>
                        {o.estado?.replace("_", " ") || "PENDIENTE"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{formatResponsables(o.responsables)}</td>
                    <td className="p-3 text-right flex justify-end gap-2">
                       <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(o)}>
                          <Pencil className="h-4 w-4 text-blue-600" />
                       </Button>
                       <Button size="icon" variant="ghost" onClick={() => handleDelete(o.id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                       </Button>
                    </td>
                 </tr>
               ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Obra" : "Nueva Obra"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
               <Input 
                 placeholder="Prefijo (Ej: ED-01)" 
                 value={form.prefijo}
                 onChange={e => setForm({...form, prefijo: e.target.value.toUpperCase()})}
               />
               <Input 
                 placeholder="Nombre de la Obra" 
                 value={form.nombre}
                 onChange={e => setForm({...form, nombre: e.target.value})}
               />
            </div>

            {/* SELECTOR MULTIPLE DE RESPONSABLES */}
            <div>
               <label className="text-sm font-medium mb-1 block">Responsables:</label>
               <Select
                  onValueChange={(val) => {
                     const id = Number(val);
                     if(!form.responsablesId.includes(id)) {
                        setForm({...form, responsablesId: [...form.responsablesId, id]});
                     }
                  }}
               >
                 <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario..." />
                 </SelectTrigger>
                 <SelectContent>
                    {users.length === 0 ? (
                       <SelectItem value="0" disabled>No hay usuarios disponibles</SelectItem>
                    ) : (
                       users.map(u => (
                          <SelectItem 
                             key={u.id} 
                             value={u.id.toString()}
                             disabled={form.responsablesId.includes(u.id)}
                          >
                             {u.nombreCompleto} — <span className="text-xs text-gray-500 uppercase">{u.role}</span>
                          </SelectItem>
                       ))
                    )}
                 </SelectContent>
               </Select>

               {/* CHIPS DE SELECCIONADOS */}
               <div className="flex flex-wrap gap-2 mt-2">
                  {form.responsablesId.map(id => {
                     const u = users.find(user => user.id === id);
                     if(!u) return null;
                     return (
                        <span key={id} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs flex items-center gap-1 border border-blue-100">
                           {u.nombreCompleto}
                           <button 
                             onClick={() => setForm({...form, responsablesId: form.responsablesId.filter(x => x !== id)})}
                             className="ml-1 hover:text-red-600"
                           >
                              &times;
                           </button>
                        </span>
                     )
                  })}
               </div>
            </div>

            <Textarea 
               placeholder="Observaciones..." 
               value={form.observaciones}
               onChange={e => setForm({...form, observaciones: e.target.value})}
            />

            {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}

            <Button onClick={handleSubmit} className="w-full bg-[#0C2D57]">
               {editingId ? "Guardar Cambios" : "Crear Obra"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}