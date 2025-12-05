"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Agregamos 'Tag' para el icono de variable
import { Search, Plus, Pencil, Trash2, RefreshCw, Tag } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Variable {
  id: number;
  nombre: string;
  observaciones?: string;
}

export default function VariablesPage() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", observaciones: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  const fetchVariables = async () => {
    setLoading(true);
    try {
      const res = await apiGet<Variable[]>("/variables");
      setVariables(res);
    } catch {
      toast.error("Error al cargar las variables.");
    } finally {
      setLoading(false);
    }
  };

  // 🔐 Bloqueo de acceso: solo ADMIN puede ver esta página
  useEffect(() => {
    const init = async () => {
      try {
        const me = await apiGet<{ id: number; role: string }>("/auth/me");

        if (me.role !== "ADMIN") {
          router.replace("/"); // redirige a inicio si no es ADMIN
          return;
        }

        setAuthorized(true);
        await fetchVariables();
      } catch (err) {
        console.error("Error obteniendo usuario actual en /variables:", err);
        router.replace("/");
      }
    };

    init();
  }, [router]);

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre de la variable es obligatorio.");
      return;
    }

    try {
      if (editId) {
        await apiPut(`/variables/${editId}`, form);
        toast.success("Variable actualizada correctamente.");
      } else {
        await apiPost("/variables", form);
        toast.success("Variable agregada exitosamente.");
      }

      setForm({ nombre: "", observaciones: "" });
      setEditId(null);
      setOpen(false);
      fetchVariables();
    } catch {
      toast.error("Error al guardar la variable.");
    }
  };

  const handleEdit = (variable: Variable) => {
    setForm({
      nombre: variable.nombre,
      observaciones: variable.observaciones || "",
    });
    setEditId(variable.id);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar esta variable?")) return;
    try {
      await apiDelete(`/variables/${id}`);
      toast.success("Variable eliminada.");
      fetchVariables();
    } catch {
      toast.error("Error al eliminar la variable.");
    }
  };

  const filteredVariables = useMemo(() => {
    if (!searchTerm) return variables;
    const term = searchTerm.toLowerCase();
    return variables.filter(
      (v) =>
        v.nombre.toLowerCase().includes(term) ||
        v.observaciones?.toLowerCase().includes(term),
    );
  }, [variables, searchTerm]);

  // Evitar parpadeo de contenido mientras validamos rol
  if (!authorized) {
    return null; // o un loader si quieres
  }

  return (
    // ✅ Padding responsivo
    <main className="p-4 md:p-8">
      {/* HEADER adaptable */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
          Informe de Variables
        </h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={fetchVariables} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            className="bg-[#16A34A] hover:bg-green-700 text-white flex-1 md:flex-none"
            onClick={() => {
              setForm({ nombre: "", observaciones: "" });
              setEditId(null);
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por Variable u Observaciones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Cargando...</p>
        ) : filteredVariables.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No hay variables registradas.</p>
        ) : (
          filteredVariables.map((v) => (
            <Card key={v.id} className="shadow-sm border border-gray-200">
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 p-2 rounded-full">
                    <Tag className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">{v.nombre}</h3>
                    <p className="text-xs text-gray-400">ID: {v.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-3">
                {v.observaciones && (
                  <div className="bg-gray-50 p-2 rounded text-gray-600 text-xs italic">
                    "{v.observaciones}"
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 border-t mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(v)}
                  >
                    <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(v.id)}
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
              <TableHead>Variable</TableHead>
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
            ) : filteredVariables.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-gray-500"
                >
                  No hay variables registradas.
                </TableCell>
              </TableRow>
            ) : (
              filteredVariables.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.id}</TableCell>
                  <TableCell className="font-medium">{v.nombre}</TableCell>
                  <TableCell>{v.observaciones || "—"}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(v)}
                    >
                      <Pencil className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(v.id)}
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

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90%] md:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar Variable" : "Nuevo Registro de Variables"}
            </DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Variable *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
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
            className="bg-[#16A34A] hover:bg-green-700 text-white w-full"
          >
            {editId ? "Actualizar" : "Agregar"}
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}