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
import {
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Construction,
  User,
  Lock,
  LockOpen,
} from "lucide-react";
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
  const [users, setUsers] = useState<Responsable[]>([]); // Lista fusionada
  const [loading, setLoading] = useState(false);

  // Estados para el Modal
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ NUEVO: Controla si el prefijo se calcula solo o es manual
  const [isPrefixLocked, setIsPrefixLocked] = useState(true);

  // Usuario actual
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------------------------------------------------------------
  // ✅ NUEVO: Generador de Prefijos Inteligente (hasta 3 letras)
  // ---------------------------------------------------------------------
  const generateSmartPrefix = (name: string) => {
    if (!name) return "";

    const ignoredWords = ["de", "del", "la", "las", "el", "los", "y", "en", "para"];

    // Normaliza acentos para que "José" -> "Jose"
    const normalized = name
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const words = normalized.split(/\s+/);

    let initials = "";

    for (const word of words) {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!cleanWord) continue;

      if (!ignoredWords.includes(cleanWord)) {
        initials += cleanWord[0];
      }

      if (initials.length >= 3) break;
    }

    // Caso borde: si todo eran conectores, tomamos las primeras 3 letras del string sin espacios
    if (initials.length === 0 && normalized.length > 0) {
      initials = normalized.replace(/\s/g, "").substring(0, 3);
    }

    return initials.toUpperCase();
  };

  // ---------------------------------------------------------------------
  // 1. CARGA INICIAL
  // ---------------------------------------------------------------------

  useEffect(() => {
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

      // B) Cargar Usuarios (Fusión Inteligente: YO + MIS EMPLEADOS)
      const token = Cookies.get("svtec_token");
      let role = "";
      let myId = 0;
      let myUsername = "";

      if (token) {
        try {
          const d: any = jwtDecode(token);
          role = d.role;
          myId = d.sub || d.id;
          myUsername = d.username;
        } catch (e) {}
      }

      if (role === "ADMIN" || role === "DIRECTOR") {
        const mapaUsuarios = new Map<number, Responsable>();

        // 1. Agregar al director desde token (garantía)
        if (myId) {
          mapaUsuarios.set(myId, {
            id: myId,
            nombreCompleto: myUsername,
            username: myUsername,
            role: role,
          });
        }

        // 2. Intentar mejorar datos del director
        try {
          const me = await apiGet<any>("/auth/me");
          if (me && me.id === myId) {
            mapaUsuarios.set(myId, {
              id: me.id,
              nombreCompleto: me.nombreCompleto || me.username,
              username: me.username,
              role: me.role,
            });
          }
        } catch (e) {
          console.log("Usando datos de sesión para el director.");
        }

        // 3. Agregar empleados (BD)
        try {
          const listaEmpleados = await apiGet<any[]>("/users");
          if (Array.isArray(listaEmpleados)) {
            listaEmpleados.forEach((emp) => {
              if (emp.active) {
                mapaUsuarios.set(emp.id, {
                  id: emp.id,
                  nombreCompleto: emp.nombreCompleto || emp.username,
                  username: emp.username,
                  role: emp.role,
                });
              }
            });
          }
        } catch (error) {
          console.log("No se pudieron cargar empleados", error);
        }

        // 4. Filtrar y guardar
        const todos = Array.from(mapaUsuarios.values());
        const rolesValidos = ["DIRECTOR", "SUPERVISOR", "RESIDENTE"];

        const usuariosFinales = todos.filter(
          (u) => u.role && rolesValidos.includes(u.role.toUpperCase())
        );

        // Ordenar: Director primero, luego alfabético
        usuariosFinales.sort((a, b) => {
          if (a.role === "DIRECTOR") return -1;
          if (b.role === "DIRECTOR") return 1;
          return a.nombreCompleto.localeCompare(b.nombreCompleto);
        });

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
  // 2. FILTROS VISUALES
  // ---------------------------------------------------------------------
  const filteredObras = useMemo(() => {
    let list = obras;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.nombre.toLowerCase().includes(s) ||
          o.prefijo.toLowerCase().includes(s)
      );
    }

    if (currentUserRole !== "ADMIN" && currentUserId) {
      list = list.filter(
        (o) =>
          o.creatorId === currentUserId ||
          o.responsables.some((r) => r.id === currentUserId)
      );
    }
    return list;
  }, [obras, currentUserRole, currentUserId, searchTerm]);

  // ---------------------------------------------------------------------
  // 3. HANDLERS
  // ---------------------------------------------------------------------
  const handleOpenRegister = () => {
    setErrorMsg("");
    setEditingId(null);

    // ✅ NUEVO: al crear, el prefijo va en modo auto
    setIsPrefixLocked(true);

    // Pre-seleccionar al usuario actual (TÚ) por defecto
    if (currentUserId && users.some((u) => u.id === currentUserId)) {
      setForm({ ...initialFormState, responsablesId: [currentUserId] });
    } else {
      setForm(initialFormState);
    }

    setOpen(true);
  };

  const handleOpenEdit = async (obra: Obra) => {
    setErrorMsg("");
    setEditingId(obra.id);

    // ✅ NUEVO: al editar, NO auto-cambiar prefijo por seguridad
    setIsPrefixLocked(false);

    try {
      const res = await apiGet<Obra>(`/obras/${obra.id}`);
      setForm({
        prefijo: res.prefijo,
        nombre: res.nombre,
        observaciones: res.observaciones || "",
        responsablesId: res.responsables.map((r) => r.id),
      });
      setOpen(true);
    } catch (e) {
      toast.error("Error al cargar obra.");
    }
  };

  const handleSubmit = async () => {
    setErrorMsg("");
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
      fetchData();
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
    } catch (e) {
      toast.error("Error al eliminar.");
    }
  };

  const getStatusColor = (st?: string | null) => {
    if (st === "FINALIZADA") return "bg-green-100 text-green-700";
    if (st === "EN_PROGRESO") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  };

  // ---------------------------------------------------------------------
  // 4. RENDER
  // ---------------------------------------------------------------------
  return (
    <main className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-[#0C2D57]">Gestión de Obras</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          {(currentUserRole === "ADMIN" || currentUserRole === "DIRECTOR") && (
            <Button
              className="bg-[#0C2D57] flex-1 md:flex-none"
              onClick={handleOpenRegister}
            >
              + Nueva Obra
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Buscar obra..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No hay obras registradas.
                </td>
              </tr>
            ) : (
              filteredObras.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-gray-500 font-mono">#{o.id}</td>
                  <td className="p-3">
                    <Badge variant="outline">{o.prefijo}</Badge>
                  </td>
                  <td className="p-3 font-semibold text-gray-800">{o.nombre}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(
                        o.estado
                      )}`}
                    >
                      {o.estado?.replace("_", " ") || "PENDIENTE"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600 text-xs">
                    {o.responsables?.map((r) => r.nombreCompleto).join(", ") ||
                      "-"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(o)}
                      >
                        <Pencil className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(o.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredObras.map((o) => (
          <Card key={o.id} className="border border-gray-200">
            <CardHeader className="pb-2 pt-4 px-4 flex flex-row justify-between">
              <div>
                <div className="flex gap-2 mb-1">
                  <Badge variant="outline">{o.prefijo}</Badge>
                  <span
                    className={`text-[10px] px-2 rounded-full flex items-center ${getStatusColor(
                      o.estado
                    )}`}
                  >
                    {o.estado?.replace("_", " ")}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{o.nombre}</h3>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm text-gray-600">
              <div className="mb-2 flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5" />
                <span>{o.responsables?.map((r) => r.nombreCompleto).join(", ")}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenEdit(o)}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(o.id)}
                >
                  Eliminar
                </Button>
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
              {/* ✅ PREFIJO (AUTO / MANUAL CON DOBLE CLICK) */}
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Prefijo{" "}
                  {isPrefixLocked && (
                    <span className="text-[10px] text-blue-600">(Auto)</span>
                  )}
                </label>

                <div className="relative">
                  <Input
                    placeholder={isPrefixLocked ? "Auto..." : "Ej: ED-001"}
                    value={form.prefijo}
                    readOnly={isPrefixLocked}
                    onDoubleClick={() => setIsPrefixLocked(false)}
                    title="Doble click para editar manualmente"
                    onChange={(e) =>
                      setForm({ ...form, prefijo: e.target.value.toUpperCase() })
                    }
                    className={
                      isPrefixLocked
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed pr-8"
                        : "bg-white pr-8"
                    }
                    maxLength={3}
                  />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {isPrefixLocked ? (
                      <Lock className="h-3 w-3" />
                    ) : (
                      <LockOpen className="h-3 w-3" />
                    )}
                  </div>
                </div>

                {isPrefixLocked && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Doble click para editar manualmente
                  </p>
                )}
              </div>

              {/* ✅ NOMBRE (SI PREFIJO ESTÁ LOCKED, GENERA AUTOMÁTICO) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Nombre
                </label>
                <Input
                  placeholder="Nombre de la obra"
                  value={form.nombre}
                  onChange={(e) => {
                    const newVal = e.target.value;

                    const nextForm: FormState = { ...form, nombre: newVal };

                    if (isPrefixLocked) {
                      nextForm.prefijo = generateSmartPrefix(newVal);
                    }

                    setForm(nextForm);
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Responsables ({users.length})
              </label>

              <Select
                onValueChange={(v) => {
                  const id = Number(v);
                  if (!form.responsablesId.includes(id)) {
                    setForm({
                      ...form,
                      responsablesId: [...form.responsablesId, id],
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id.toString()}
                      disabled={form.responsablesId.includes(u.id)}
                    >
                      {u.nombreCompleto}{" "}
                      <span className="text-xs text-gray-400">({u.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 mt-2">
                {form.responsablesId.map((id) => {
                  const u = users.find((x) => x.id === id);
                  const displayName = u ? u.nombreCompleto : `Usuario #${id}`;

                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      {displayName}
                      <button
                        onClick={() =>
                          setForm({
                            ...form,
                            responsablesId: form.responsablesId.filter(
                              (x) => x !== id
                            ),
                          })
                        }
                        className="hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <Trash2 className="h-3 w-3 text-gray-600" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">
                Observaciones
              </label>
              <Textarea
                placeholder="Detalles adicionales..."
                value={form.observaciones}
                onChange={(e) =>
                  setForm({ ...form, observaciones: e.target.value })
                }
              />
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm text-center">{errorMsg}</p>
            )}

            <Button
              onClick={handleSubmit}
              className="w-full bg-[#0C2D57] hover:bg-[#1e457a]"
            >
              {editingId ? "Guardar Cambios" : "Agregar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
