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
// Usamos solo iconos estándar para evitar crashes
import { Search, RefreshCw, Pencil, Trash2, Construction, User } from "lucide-react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------
// TIPOS
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
  estado?: string | null;
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
  const [users, setUsers] = useState<Responsable[]>([]); // Aquí guardaremos la lista fusionada
  const [loading, setLoading] = useState(false);
  
  // Estados para el Modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errorMsg, setErrorMsg] = useState("");

  // Usuario actual
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------------------------------------------------------------
  // 1. CARGA INICIAL
  // ---------------------------------------------------------------------

  useEffect(() => {
    // Decodificar token de forma segura
    const token = Cookies.get("svtec_token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUserId(decoded.sub || decoded.id);
        setCurrentUserRole(decoded.role);
      } catch (e) {
        console.error("Error al leer token:", e);
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // A) Cargar Obras
      const obrasRes = await apiGet<Obra[]>("/obras");
      setObras(obrasRes);

      // B) Cargar Usuarios (Fusión: YO + MIS EMPLEADOS)
      // Solo si soy ADMIN o DIRECTOR intentamos cargar lista de usuarios
      const token = Cookies.get("svtec_token");
      let role = "";
      if (token) {
         try {
             const d: any = jwtDecode(token);
             role = d.role;
         } catch(e) {}
      }

      if (role === "ADMIN" || role === "DIRECTOR") {
          // 1. Traer empleados (apiGet puede fallar si no hay, por eso try/catch)
          let listaEmpleados: any[] = [];
          try {
             listaEmpleados = await apiGet<any[]>("/users");
          } catch (error) {
             console.log("No se pudieron cargar empleados o lista vacía", error);
          }

          // 2. Traerme a MÍ MISMO (apiGet /auth/me)
          let yoMismo: any = null;
          try {
             yoMismo = await apiGet<any>("/auth/me");
          } catch (error) {
             console.log("Error cargando perfil propio", error);
          }

          // 3. FUSIONAR LISTAS (Usando un Map para evitar duplicados por ID)
          const mapaUsuarios = new Map();

          // Prioridad: Yo mismo
          if (yoMismo && yoMismo.id) {
              mapaUsuarios.set(yoMismo.id, {
                  id: yoMismo.id,
                  nombreCompleto: yoMismo.nombreCompleto || yoMismo.username,
                  username: yoMismo.username,
                  role: yoMismo.role
              });
          }

          // Agregar empleados
          if (Array.isArray(listaEmpleados)) {
              listaEmpleados.forEach(emp => {
                  if (emp.active) { // Solo activos
                      mapaUsuarios.set(emp.id, {
                          id: emp.id,
                          nombreCompleto: emp.nombreCompleto || emp.username,
                          username: emp.username,
                          role: emp.role
                      });
                  }
              });
          }

          // 4. Convertir a array y FILTRAR roles permitidos
          const todos = Array.from(mapaUsuarios.values());
          const rolesValidos = ["DIRECTOR", "SUPERVISOR", "RESIDENTE"];
          
          const usuariosFinales = todos.filter(u => 
              u.role && rolesValidos.includes(u.role.toUpperCase())
          );

          setUsers(usuariosFinales);
      }

    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // 2. FILTROS VISUALES (Tabla)
  // ---------------------------------------------------------------------
  const filteredObras = useMemo(() => {
    let list = obras;
    
    // Buscador
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(o => 
        o.nombre.toLowerCase().includes(s) || o.prefijo.toLowerCase().includes(s)
      );
    }

    // Permisos: Si no soy admin, solo veo lo mío
    if (currentUserRole !== "ADMIN" && currentUserId) {
        list = list.filter(o => 
            o.creatorId === currentUserId || 
            o.responsables.some(r => r.id === currentUserId)
        );
    }
    return list;
  }, [obras, currentUserRole, currentUserId, searchTerm]);

  // ---------------------------------------------------------------------
  // 3. MANEJO DEL FORMULARIO
  // ---------------------------------------------------------------------
  const handleOpenRegister = () => {
    setErrorMsg("");
    setEditingId(null);
    // Pre-seleccionar al usuario actual si está en la lista válida
    if (currentUserId && users.some(u => u.id === currentUserId)) {
        setForm({ ...initialFormState, responsablesId: [currentUserId] });
    } else {
        setForm(initialFormState);
    }
    setOpen(true);
  };

  const handleOpenEdit = async (obra: Obra) => {
    setErrorMsg("");
    setEditingId(obra.id);
    try {
        const res = await apiGet<Obra>(`/obras/${obra.id}`);
        setForm({
            prefijo: res.prefijo,
            nombre: res.nombre,
            observaciones: res.observaciones || "",
            responsablesId: res.responsables.map(r => r.id)
        });
        setOpen(true);
    } catch (e) {
        toast.error("No se pudo cargar la información de la obra.");
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    // Validaciones
    if (!form.prefijo || !form.nombre) {
        setErrorMsg("El Prefijo y el Nombre son obligatorios.");
        return;
    }
    if (form.responsablesId.length === 0) {
        setErrorMsg("Debes asignar al menos un responsable.");
        return;
    }

    const payload = {
        prefijo: form.prefijo,
        nombre: form.nombre,
        responsablesId: form.responsablesId,
        observaciones: form.observaciones || null
    };

    try {
        if (editingId) {
            await apiPatch(`/obras/${editingId}`, payload);
            toast.success("Obra actualizada correctamente.");
        } else {
            await apiPost("/obras", payload);
            toast.success("Obra creada exitosamente.");
        }
        setOpen(false);
        fetchData(); // Recargar la tabla
    } catch (err: any) {
        console.error(err);
        toast.error(err?.response?.data?.message || "Error al guardar.");
    }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("¿Seguro que deseas eliminar esta obra?")) return;
      try {
          await apiDelete(`/obras/${id}`);
          toast.success("Obra eliminada.");
          fetchData();
      } catch (e) {
          toast.error("Error al eliminar.");
      }
  };

  // Utility
  const getStatusColor = (st?: string | null) => {
      if (st === "FINALIZADA") return "bg-green-100 text-green-700";
      if (st === "EN_PROGRESO") return "bg-blue-100 text-blue-700";
      return "bg-yellow-100 text-yellow-700";
  }

  // ---------------------------------------------------------------------
  // 4. RENDER (HTML)
  // ---------------------------------------------------------------------
  return (
    <main className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-[#0C2D57]">Gestión de Obras</h1>
          <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                  <RefreshCw className={loading ? "animate-spin" : ""} />
              </Button>
              {(currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR") && (
                  <Button className="bg-[#0C2D57] flex-1 md:flex-none" onClick={handleOpenRegister}>
                      + Nueva Obra
                  </Button>
              )}
          </div>
      </div>

      {/* Buscador */}
      <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-9" 
            placeholder="Buscar obra..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hidden md:block">
          <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700 text-left">
                  <tr>
                      <th className="p-3 w-16">ID</th>
                      <th className="p-3 w-32">Prefijo</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3 w-32">Estado</th>
                      <th className="p-3">Responsables</th>
                      <th className="p-3 text-right">Acciones</th>
                  </tr>
              </thead>
              <tbody>
                  {filteredObras.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay obras registradas.</td></tr>
                  ) : (
                      filteredObras.map(o => (
                          <tr key={o.id} className="border-t hover:bg-gray-50">
                              <td className="p-3 text-gray-500 font-mono">#{o.id}</td>
                              <td className="p-3"><Badge variant="outline">{o.prefijo}</Badge></td>
                              <td className="p-3 font-semibold text-gray-800">{o.nombre}</td>
                              <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(o.estado)}`}>
                                      {o.estado?.replace("_", " ") || "PENDIENTE"}
                                  </span>
                              </td>
                              <td className="p-3 text-gray-600 text-xs">
                                  {o.responsables?.map(r => r.nombreCompleto).join(", ") || "-"}
                              </td>
                              <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                      <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(o)}>
                                          <Pencil className="h-4 w-4 text-blue-600"/>
                                      </Button>
                                      <Button size="icon" variant="ghost" onClick={() => handleDelete(o.id)}>
                                          <Trash2 className="h-4 w-4 text-red-600"/>
                                      </Button>
                                  </div>
                              </td>
                          </tr>
                      ))
                  )}
              </tbody>
          </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
         {filteredObras.map(o => (
             <Card key={o.id} className="border border-gray-200">
                 <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between">
                     <div>
                         <div className="flex gap-2 mb-1">
                             <Badge variant="outline">{o.prefijo}</Badge>
                             <span className={`text-[10px] px-2 rounded-full flex items-center ${getStatusColor(o.estado)}`}>
                                 {o.estado?.replace("_", " ")}
                             </span>
                         </div>
                         <h3 className="font-bold text-lg">{o.nombre}</h3>
                     </div>
                 </CardHeader>
                 <CardContent className="px-4 pb-4 text-sm text-gray-600">
                     <div className="mb-2 flex items-start gap-2">
                         <User className="h-4 w-4 mt-0.5"/> 
                         <span>{o.responsables?.map(r=>r.nombreCompleto).join(", ")}</span>
                     </div>
                     <div className="flex gap-2 mt-4">
                         <Button variant="outline" size="sm" className="flex-1" onClick={()=>handleOpenEdit(o)}>Editar</Button>
                         <Button variant="destructive" size="sm" className="flex-1" onClick={()=>handleDelete(o.id)}>Eliminar</Button>
                     </div>
                 </CardContent>
             </Card>
         ))}
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Obra" : "Nueva Obra"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Prefijo</label>
                          <Input 
                              placeholder="Ej: ED-001" 
                              value={form.prefijo} 
                              onChange={e => setForm({...form, prefijo: e.target.value.toUpperCase()})}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre</label>
                          <Input 
                              placeholder="Nombre de la obra" 
                              value={form.nombre} 
                              onChange={e => setForm({...form, nombre: e.target.value})}
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                          Responsables ({users.length} disponibles)
                      </label>
                      <Select onValueChange={(v) => {
                          const id = Number(v);
                          if (!form.responsablesId.includes(id)) {
                              setForm({ ...form, responsablesId: [...form.responsablesId, id] });
                          }
                      }}>
                          <SelectTrigger>
                              <SelectValue placeholder="Seleccionar usuario..." />
                          </SelectTrigger>
                          <SelectContent>
                              {users.map(u => (
                                  <SelectItem key={u.id} value={u.id.toString()} disabled={form.responsablesId.includes(u.id)}>
                                      {u.nombreCompleto} <span className="text-xs text-gray-400">({u.role})</span>
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      
                      {/* Chips de seleccionados */}
                      <div className="flex flex-wrap gap-2 mt-2">
                          {form.responsablesId.map(id => {
                              const u = users.find(x => x.id === id);
                              if (!u) return null;
                              return (
                                  <Badge key={id} variant="secondary" className="flex items-center gap-1 pr-1">
                                      {u.nombreCompleto}
                                      <button 
                                          onClick={() => setForm({...form, responsablesId: form.responsablesId.filter(x => x !== id)})}
                                          className="hover:bg-gray-300 rounded-full p-0.5"
                                      >
                                          <Trash2 className="h-3 w-3 text-gray-600"/>
                                      </button>
                                  </Badge>
                              )
                          })}
                      </div>
                  </div>

                  <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">Observaciones</label>
                      <Textarea 
                          placeholder="Detalles adicionales..." 
                          value={form.observaciones}
                          onChange={e => setForm({...form, observaciones: e.target.value})}
                      />
                  </div>

                  {errorMsg && <p className="text-red-500 text-sm text-center">{errorMsg}</p>}

                  <Button onClick={handleSubmit} className="w-full bg-[#0C2D57] hover:bg-[#1e457a]">
                      {editingId ? "Guardar Cambios" : "Crear Obra"}
                  </Button>
              </div>
          </DialogContent>
      </Dialog>
    </main>
  );
}