"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Search, Plus, Pencil, Trash2, RefreshCw, Ruler } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Unidad {
  id: number;
  nombre: string;
  observaciones?: string | null;
}

export default function UnidadesPage() {
  const [items, setItems] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", observaciones: "" });

  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: Unidad[] = await apiGet("/unidades");
      setItems(res);
    } catch {
      toast.error("Error al cargar las unidades");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Bloqueo: solo ADMIN puede acceder a esta página
  useEffect(() => {
    const init = async () => {
      try {
        const me = await apiGet<{ role: string }>("/auth/me");

        if (me.role !== "ADMIN") {
          router.replace("/"); // redirige si no es admin
          return;
        }

        setAuthorized(true);
        await fetchData();
      } catch (err) {
        console.error("Error obteniendo usuario actual en /unidades:", err);
        router.replace("/");
      }
    };

    init();
  }, [router]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const term = search.toLowerCase();
    return items.filter(
      (i) =>
        i.nombre.toLowerCase().includes(term) ||
        (i.observaciones || "").toLowerCase().includes(term),
    );
  }, [items, search]);

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    try {
      if (editId) {
        await apiPut(`/unidades/${editId}`, form);
        toast.success("Unidad actualizada");
      } else {
        await apiPost("/unidades", form);
        toast.success("Unidad creada");
      }
      setOpen(false);
      setForm({ nombre: "", observaciones: "" });
      fetchData();
    } catch {
      toast.error("Error al guardar");
    }
  };

  const handleEdit = (u: Unidad) => {
    setEditId(u.id);
    setForm({ nombre: u.nombre, observaciones: u.observaciones || "" });
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta unidad?")) return;
    try {
      await apiDelete(`/unidades/${id}`);
      toast.success("Unidad eliminada");
      fetchData();
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  // Evitar parpadeo mientras validamos rol / auth
  if (!authorized) {
    return null; // o un loader/spinner si prefieres
  }

  return (
    // ✅ Padding responsivo
    <main className="p-4 md:p-8">
      {/* HEADER adaptable */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
          Informe de Unidades
        </h1>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditId(null);
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none">
                <Plus className="h-4 w-4 mr-1" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90%] md:max-w-md rounded-lg">
              <DialogHeader>
                <DialogTitle>
                  {editId ? "Editar Unidad" : "Nueva Unidad"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder="Unidad * (ej. metros)"
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

      <div className="relative w-full max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nombre u observaciones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Cargando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No hay unidades registradas.</p>
        ) : (
          filtered.map((u) => (
            <Card key={u.id} className="shadow-sm border border-gray-200">
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-full">
                    <Ruler className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{u.nombre}</h3>
                    <p className="text-xs text-gray-400">ID: {u.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-3">
                {u.observaciones && (
                  <div className="bg-gray-50 p-2 rounded text-gray-600 text-xs italic">
                    "{u.observaciones}"
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(u)}
                  >
                    <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
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
          ))
        )}
      </div>

      {/* 💻 VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-32 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  No hay unidades registradas.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell className="font-medium">{u.nombre}</TableCell>
                  <TableCell>{u.observaciones || "—"}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(u)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(u.id)}
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