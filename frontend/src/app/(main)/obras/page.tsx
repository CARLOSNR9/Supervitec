"use client";

import { useEffect, useState, useMemo } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/types/user";
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
import { Search, RefreshCw, Pencil, Trash2 } from "lucide-react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// ---------------------------------------------------------------------
// TIPOS Y ESTADOS
// ---------------------------------------------------------------------

interface Responsable {
  id: number;
  nombreCompleto: string;
  username: string;
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------------------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------------------------

  useEffect(() => {
    const token = Cookies.get("svtec_token");
    if (token) {
      const decoded: any = jwtDecode(token);
      setCurrentUserId(decoded.sub);
      setCurrentUserRole(decoded.role);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
  setLoading(true);
  try {

    // Solo ADMIN o DIRECTOR deben llamar /users
    if (currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR") {
        const usersRes = await apiGet<User[]>("/users");
      setUsers(usersRes.filter((u: any) => u.active));
    }

    // TODOS los roles deben llamar /obras
    const obrasRes = await apiGet("/obras");
    setObras(obrasRes);

  } catch (err) {
    console.error(err);
    toast.error("Error al cargar datos del módulo de Obras.");
  } finally {
    setLoading(false);
  }
};


  // ---------------------------------------------------------------------
  // LÓGICA DE FILTRADO
  // ---------------------------------------------------------------------
  const filteredObras = useMemo(() => {
    if (!currentUserRole) return [];

    const isAdmin = currentUserRole === "ADMIN";
    let filtered = obras;

    if (searchTerm) {
      filtered = filtered.filter(
        (obra) =>
          obra.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obra.prefijo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (!isAdmin) {
      filtered = filtered.filter(
        (obra) =>
          obra.creatorId === currentUserId ||
          obra.responsables.some((resp) => resp.id === currentUserId)
      );
    }

    return filtered;
  }, [obras, currentUserRole, currentUserId, searchTerm]);

  // ---------------------------------------------------------------------
  // LÓGICA DEL FORMULARIO
  // ---------------------------------------------------------------------

  const handleOpenRegister = () => {
    setErrorMsg("");
    setEditingId(null);

    if (currentUserId !== null) {
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
      const res = await apiGet(`/obras/${obra.id}`);
      setForm({
        prefijo: res.prefijo,
        nombre: res.nombre,
        observaciones: res.observaciones || "",
        responsablesId: res.responsables.map((r: Responsable) => r.id),
      });
      setOpen(true);
    } catch (err) {
      toast.error("Error al cargar los datos de la obra.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    setErrorMsg("");
    if (!form.prefijo || !form.nombre || form.responsablesId.length === 0) {
      setErrorMsg(
        "Prefijo, Nombre de Obra y al menos un Responsable son obligatorios."
      );
      return false;
    }
    if (form.prefijo.length > 10) {
      setErrorMsg("El Prefijo debe ser corto (máx. 10 caracteres).");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!validateForm()) return;

    // DTO limpio (sin creatorId, lo pone el backend con req.user)
    const dataToSubmit = {
      prefijo: form.prefijo,
      nombre: form.nombre,
      responsablesId: form.responsablesId,
      observaciones: form.observaciones || null,
    };

    try {
      if (editingId) {
        await apiPatch(`/obras/${editingId}`, dataToSubmit);
        toast.success("✅ Obra actualizada correctamente.");
      } else {
        await apiPost("/obras", dataToSubmit);
        toast.success("✅ Obra creada exitosamente.");
      }

      await fetchData();               // ✅ recarga obras y usuarios
      setOpen(false);
      setEditingId(null);
      setForm(initialFormState);
    } catch (err: any) {
      console.error("❌ Error guardando obra:", err?.response?.data || err);
      toast.error(
        err?.response?.data?.message || "❌ No se pudo guardar la obra."
      );
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (
      !confirm(
        `¿Deseas eliminar la obra "${nombre}"? Esta acción no se puede deshacer.`
      )
    )
      return;

    try {
      await apiDelete(`/obras/${id}`);
      toast.success(`🗑️ Obra "${nombre}" eliminada.`);
      fetchData();
    } catch (err) {
      console.error("Error al eliminar:", err);
      toast.error(
        "No se pudo eliminar la obra. Revise si tiene registros asociados."
      );
    }
  };

  const formatResponsables = (responsables: Responsable[]) => {
    if (!responsables || responsables.length === 0) return "-";
    const names = responsables.map((r) => r.nombreCompleto || r.username);
    if (names.length > 3) {
      return `${names.slice(0, 3).join(", ")} (+${names.length - 3} más)`;
    }
    return names.join(", ");
  };

  // ---------------------------------------------------------------------
  // RENDERIZADO
  // ---------------------------------------------------------------------

  const canModify =
    currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR";
    
const canDelete =
  currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR";



  return (
    <main className="p-8">
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0C2D57]">Índice de Obras</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            title="Refrescar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {canModify && (
            <Button
              onClick={handleOpenRegister}
              className="bg-[#0C2D57] hover:bg-[#113a84]"
            >
              + Nueva Obra
            </Button>
          )}
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por Prefijo o Nombre de Obra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {loading && <p className="text-sm text-gray-500">Cargando datos...</p>}
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="p-3 font-medium w-[80px]">ID</th>
              <th className="p-3 font-medium w-[100px]">Prefijo</th>
              <th className="p-3 font-medium">Nombre Obra</th>
              <th className="p-3 font-medium w-[120px]">Estado</th>
              <th className="p-3 font-medium">Responsables</th>
              <th className="p-3 font-medium">Observaciones</th>
              <th className="p-3 font-medium text-center w-[120px]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredObras.length === 0 ? (
              <tr className="border-t">
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No se encontraron obras o no tienes obras asignadas.
                </td>
              </tr>
            ) : (
              filteredObras.map((obra) => (
                <tr
                  key={obra.id}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3 font-medium text-gray-800">{obra.id}</td>
                  <td className="p-3 font-semibold">{obra.prefijo}</td>
                  <td className="p-3">{obra.nombre}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        obra.estado === "FINALIZADA"
                          ? "bg-green-100 text-green-700"
                          : obra.estado === "EN_PROGRESO"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {(obra.estado || "NO_ESTADO").replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {formatResponsables(obra.responsables)}
                  </td>
                  <td className="p-3 text-xs">
                    {obra.observaciones || "-"}
                  </td>

<td className="p-3 text-center">
  <div className="flex justify-center gap-2">
    {/* EDITAR: ADMIN y DIRECTOR */}
    {canModify && (
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleOpenEdit(obra)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    )}

    {/* ELIMINAR: ADMIN y DIRECTOR */}
    {canDelete && (
      <Button
        variant="destructive"
        size="icon"
        onClick={() => handleDelete(obra.id, obra.nombre)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )}
  </div>
</td>


                 





                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR/EDITAR */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Obra" : "Nuevo Registro de Obra"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Prefijo*"
                value={form.prefijo}
                maxLength={10}
                onChange={(e) =>
                  setForm({
                    ...form,
                    prefijo: e.target.value.toUpperCase(),
                  })
                }
                required
              />
              <Input
                placeholder="Nombre Obra*"
                value={form.nombre}
                onChange={(e) =>
                  setForm({ ...form, nombre: e.target.value })
                }
                required
              />
            </div>

            {/* Selector de responsables */}
            <div>
              <label className="text-sm font-medium">Responsables*</label>
              <Select
                value={
                  form.responsablesId.length > 0
                    ? form.responsablesId[0].toString()
                    : ""
                }
                onValueChange={(value) => {
                  const id = parseInt(value);
                  if (!form.responsablesId.includes(id)) {
                    setForm({
                      ...form,
                      responsablesId: [...form.responsablesId, id],
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione responsables..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem
                      key={user.id}
                      value={user.id.toString()}
                      disabled={form.responsablesId.includes(user.id)}
                    >
                      {user.nombreCompleto} ({user.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                {form.responsablesId.map((id) => {
                  const resp = users.find((u) => u.id === id);
                  return resp ? (
                    <span
                      key={id}
                      className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {resp.nombreCompleto || resp.username}
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            responsablesId: form.responsablesId.filter(
                              (rId) => rId !== id
                            ),
                          })
                        }
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Observaciones */}
            <Textarea
              placeholder="Observaciones"
              value={form.observaciones}
              onChange={(e) =>
                setForm({ ...form, observaciones: e.target.value })
              }
              rows={4}
            />

            {errorMsg && (
              <p className="text-sm text-red-500 text-center">{errorMsg}</p>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-2 bg-[#0C2D57] hover:bg-[#113a84]"
            >
              {loading
                ? "Guardando..."
                : editingId
                ? "Actualizar"
                : "Agregar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
