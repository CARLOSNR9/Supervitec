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
import { Search, RefreshCw, Pencil, Trash2, Construction, Bug } from "lucide-react"; // Bug icon added
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
  const [users, setUsers] = useState<Responsable[]>([]);
  
  // ESTADOS DE DEPURACIÓN (DEBUG)
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<FormState>(initialFormState);
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const addLog = (msg: string) => setDebugLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

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
        addLog(`Token decodificado. Rol: ${decoded.role}, ID: ${decoded.sub || decoded.id}`);
      } catch (e) {
        addLog("Error al decodificar token.");
      }
    } else {
      addLog("No se encontró token.");
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    addLog("Iniciando fetchData...");
    try {
      // 1. Cargar Obras
      const obrasRes = await apiGet<Obra[]>("/obras");
      setObras(obrasRes);
      addLog(`Obras cargadas: ${obrasRes.length}`);

      // 2. Cargar Usuarios
      const token = Cookies.get("svtec_token");
      let role = "";
      if (token) {
         const decoded: any = jwtDecode(token);
         role = decoded.role;
      }

      if (role === "ADMIN" || role === "DIRECTOR") {
        addLog("Rol permite cargar usuarios. Intentando GET /users...");
        let empleados: any[] = [];
        try {
          empleados = await apiGet<any[]>("/users");
          addLog(`GET /users respondió con ${empleados.length} registros.`);
          setRawData(empleados); // Guardamos la data cruda para verla en pantalla
        } catch (error: any) {
          addLog(`Error GET /users: ${error.message}`);
          console.error(error);
        }

        // Obtener datos propios
        let yo: any = null;
        try {
          yo = await apiGet<any>("/auth/me");
          addLog(`GET /auth/me OK. Usuario: ${yo?.username}`);
        } catch (error) {
           addLog("Error GET /auth/me");
        }

        // Unificar
        const mapa = new Map();
        if (yo) mapa.set(yo.id, yo);
        if (Array.isArray(empleados)) {
          empleados.forEach(emp => mapa.set(emp.id, emp));
        }

        const todos = Array.from(mapa.values());
        addLog(`Total usuarios únicos (yo + empleados): ${todos.length}`);

        // Filtrar
        const rolesPermitidos = ["DIRECTOR", "SUPERVISOR", "RESIDENTE"];
        // Normalizamos a mayúsculas por si acaso viene 'Supervisor'
        const filtrados = todos.filter(u => {
            const r = u.role ? u.role.toUpperCase() : "";
            return rolesPermitidos.includes(r);
        }).map(u => ({
            id: u.id,
            nombreCompleto: u.nombreCompleto || u.username,
            username: u.username,
            role: u.role
        }));

        setUsers(filtrados);
        addLog(`Usuarios finales en el Select: ${filtrados.length}`);
      } else {
          addLog("Rol no es ADMIN ni DIRECTOR. No se cargan usuarios.");
      }

    } catch (err) {
      console.error(err);
      toast.error("Error cargando datos");
      addLog("Error general en fetchData");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // FILTRADO VISUAL
  // ---------------------------------------------------------------------
  const filteredObras = useMemo(() => {
    let filtered = obras;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) => o.nombre.toLowerCase().includes(lower) || o.prefijo.toLowerCase().includes(lower)
      );
    }
    // Si no es admin, ver solo lo propio
    if (currentUserRole !== "ADMIN" && currentUserId) {
       filtered = filtered.filter(o => 
          o.creatorId === currentUserId || o.responsables.some(r => r.id === currentUserId)
       );
    }
    return filtered;
  }, [obras, currentUserRole, currentUserId, searchTerm]);

  // ---------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------
  const handleOpenRegister = () => {
    setErrorMsg("");
    setEditingId(null);
    if (currentUserId && users.find(u => u.id === currentUserId)) {
      setForm({ ...initialFormState, responsablesId: [currentUserId] });
    } else {
      setForm(initialFormState);
    }
    setOpen(true);
  };

  const handleOpenEdit = async (obra: Obra) => {
    setEditingId(obra.id);
    // Cargar datos fresh
    try {
        const res = await apiGet<Obra>(`/obras/${obra.id}`);
        setForm({
            prefijo: res.prefijo,
            nombre: res.nombre,
            observaciones: res.observaciones || "",
            responsablesId: res.responsables.map(r => r.id)
        });
        setOpen(true);
    } catch(e) { toast.error("Error al abrir edición"); }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!form.prefijo || !form.nombre || form.responsablesId.length === 0) {
      setErrorMsg("Faltan campos obligatorios (Prefijo, Nombre, Responsables).");
      return;
    }
    const payload = { ...form, observaciones: form.observaciones || null };

    try {
      if (editingId) {
        await apiPatch(`/obras/${editingId}`, payload);
        toast.success("Obra actualizada");
      } else {
        await apiPost("/obras", payload);
        toast.success("Obra creada");
      }
      setOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al guardar");
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("¿Eliminar obra?")) return;
    try {
        await apiDelete(`/obras/${id}`);
        toast.success("Eliminado");
        fetchData();
    } catch(e) { toast.error("No se pudo eliminar"); }
  }

  // Helpers
  const formatResp = (lista: Responsable[]) => {
      if(!lista?.length) return "-";
      return lista.map(r => r.nombreCompleto || r.username).join(", ");
  }

  // ---------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------
  return (
    <main className="p-4 md:p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#0C2D57]">Obras (Modo Diagnóstico)</h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}><RefreshCw className={loading?"animate-spin":""}/></Button>
            {(currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR") && 
                <Button onClick={handleOpenRegister} className="bg-[#0C2D57]">+ Nueva Obra</Button>
            }
        </div>
      </div>

      {/* INPUT BUSQUEDA */}
      <div className="mb-4 relative max-w-md">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
         <Input className="pl-9" placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
      </div>

      {/* TABLA SIMPLE */}
      <div className="hidden md:block bg-white shadow rounded overflow-hidden">
         <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
                <tr><th className="p-3">ID</th><th className="p-3">Obra</th><th className="p-3">Resp</th><th className="p-3 text-right">Acción</th></tr>
            </thead>
            <tbody>
                {filteredObras.length===0 && <tr><td colSpan={4} className="p-4 text-center">Sin datos</td></tr>}
                {filteredObras.map(o => (
                    <tr key={o.id} className="border-t">
                        <td className="p-3">#{o.id}</td>
                        <td className="p-3 font-bold">{o.nombre} <span className="text-xs font-normal text-gray-500">({o.prefijo})</span></td>
                        <td className="p-3">{formatResp(o.responsables)}</td>
                        <td className="p-3 text-right">
                            <Button size="icon" variant="ghost" onClick={()=>handleOpenEdit(o)}><Pencil className="h-4 w-4"/></Button>
                            <Button size="icon" variant="ghost" className="text-red-500" onClick={()=>handleDelete(o.id)}><Trash2 className="h-4 w-4"/></Button>
                        </td>
                    </tr>
                ))}
            </tbody>
         </table>
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingId?"Editar":"Crear"} Obra</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <Input placeholder="Prefijo" value={form.prefijo} onChange={e=>setForm({...form, prefijo:e.target.value.toUpperCase()})}/>
                <Input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
                
                <div>
                    <label className="text-sm font-bold">Responsables ({users.length} cargados)</label>
                    <Select onValueChange={(v) => {
                        const id = Number(v);
                        if(!form.responsablesId.includes(id)) setForm({...form, responsablesId:[...form.responsablesId, id]});
                    }}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..."/></SelectTrigger>
                        <SelectContent>
                            {users.map(u => (
                                <SelectItem key={u.id} value={u.id.toString()}>{u.nombreCompleto} - {u.role}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {form.responsablesId.map(id => {
                            const u = users.find(x=>x.id===id);
                            return u ? <span key={id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{u.nombreCompleto}</span> : null
                        })}
                    </div>
                </div>

                <Textarea placeholder="Obs..." value={form.observaciones} onChange={e=>setForm({...form, observaciones:e.target.value})}/>
                {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
                <Button onClick={handleSubmit} className="w-full bg-[#0C2D57]">Guardar</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* ================================================================================= */}
      {/* 🛠️ ÁREA DE DIAGNÓSTICO (ESTO TE DIRÁ QUÉ ESTÁ PASANDO) */}
      {/* ================================================================================= */}
      <div className="mt-8 p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-lg shadow-xl overflow-x-auto">
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><Bug/> Consola de Diagnóstico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <strong className="text-white block mb-1">LOG DE EVENTOS:</strong>
                  <div className="h-40 overflow-y-auto border border-slate-700 p-2 bg-slate-950">
                      {debugLog.map((l,i) => <div key={i}>{l}</div>)}
                  </div>
              </div>
              <div>
                  <strong className="text-white block mb-1">DATA CRUDA DEL BACKEND (/users):</strong>
                  <div className="h-40 overflow-y-auto border border-slate-700 p-2 bg-slate-950 whitespace-pre">
                      {JSON.stringify(rawData, null, 2) || "Esperando data..."}
                  </div>
              </div>
          </div>
      </div>
    </main>
  );
}