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
// Agregamos 'Scale' para el icono de medición
import { Search, Plus, Pencil, Trash2, RefreshCw, Scale } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
    // ✅ Padding responsivo
    <main className="p-4 md:p-8">
      {/* HEADER ADAPTABLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
          Informe de Mediciones
        </h1>
        
        <div className="flex gap-2 w-full md:w-auto">
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
                className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
                onClick={() => {
                  resetForm();
                  setOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90%] md:max-w-md rounded-lg">
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
          placeholder="Buscar por Medición u Observaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No hay mediciones registradas.</p>
        ) : (
          filtered.map((m) => (
            <Card key={m.id} className="shadow-sm border border-gray-200">
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 p-2 rounded-full">
                    <Scale className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{m.nombre}</h3>
                    <p className="text-xs text-gray-400">ID: {m.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-3">
                {m.observaciones && (
                  <div className="bg-gray-50 p-2 rounded text-gray-600 text-xs italic">
                    "{m.observaciones}"
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(m)}
                  >
                    <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 💻 VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-gray-500"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-gray-500"
                >
                  No hay mediciones registradas.
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