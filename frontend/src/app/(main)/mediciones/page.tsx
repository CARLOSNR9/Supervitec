"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Medicion {
  id: number;
  nombre: string;
  observaciones?: string | null;
}

export default function MedicionesPage() {
  const [items, setItems] = useState<Medicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", observaciones: "" });

  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  // ----------------------------
  // Data fetching
  // ----------------------------
  const fetchMediciones = async () => {
    setLoading(true);
    try {
      const res: Medicion[] = await apiGet("/mediciones");
      setItems(res);
    } catch (e) {
      toast.error("Error al cargar las mediciones.");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Bloqueo: solo ADMIN puede acceder a esta página
  useEffect(() => {
    const init = async () => {
      try {
        const me = await apiGet<User>("/auth/me");

        if (me.role !== "ADMIN") {
          router.replace("/"); // si no es admin, redirige al inicio
          return;
        }

        setAuthorized(true);
        await fetchMediciones();
      } catch (err) {
        console.error("Error obteniendo usuario actual en /mediciones:", err);
        router.replace("/");
      }
    };

    init();
  }, [router]);

  // ----------------------------
  // Helpers
  // ----------------------------
  const resetForm = () => {
    setForm({ nombre: "", observaciones: "" });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre de la medición es obligatorio.");
      return;
    }
    try {
      if (editId) {
        await apiPut(`/mediciones/${editId}`, form);
        toast.success("Medición actualizada correctamente.");
      } else {
        await apiPost("/mediciones", form);
        toast.success("Medición creada exitosamente.");
      }
      setOpen(false);
      resetForm();
      fetchMediciones();
    } catch {
      toast.error("No se pudo guardar la medición.");
    }
  };

  const handleEdit = (m: Medicion) => {
    setEditId(m.id);
    setForm({ nombre: m.nombre, observaciones: m.observaciones || "" });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta medición?")) return;
    try {
      await apiDelete(`/mediciones/${id}`);
      toast.success("Medición eliminada.");
      fetchMediciones();
    } catch {
      toast.error("No se pudo eliminar la medición.");
    }
  };

  // ----------------------------
  // Search
  // ----------------------------
  const filtered = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (i) =>
        i.nombre.toLowerCase().includes(term) ||
        (i.observaciones || "").toLowerCase().includes(term),
    );
  }, [items, searchTerm]);

  // Evitamos pintar la página mientras validamos rol
  if (!authorized) {
    return null; // o un loader si quieres
  }

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <main className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0C2D57]">
          Informe de Mediciones
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMediciones}
            disabled={loading}
            title="Refrescar"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>

          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editId
                    ? "Editar Medición"
                    : "Nuevo Registro de Mediciones"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <Input
                  placeholder="Nombre de la medición * (ej. LONGITUD)"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Observaciones"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  className="h-24"
                />
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {editId ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Búsqueda rápida por Medición u Observaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-100 text-gray-700">
            <TableRow>
              <TableHead className="w-16">Id</TableHead>
              <TableHead>Medición</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-32 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-gray-500"
                >
                  {loading
                    ? "Cargando..."
                    : "No hay mediciones registradas."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id} className="hover:bg-gray-50">
                  <TableCell>{m.id}</TableCell>
                  <TableCell className="font-medium">{m.nombre}</TableCell>
                  <TableCell>{m.observaciones || "—"}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(m)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(m.id)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
