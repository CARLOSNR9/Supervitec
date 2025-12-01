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
import { Search, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
        const me = await apiGet("/auth/me");

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
    <main className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0C2D57]">
          Informe de Variables
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVariables} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            className="bg-[#16A34A] hover:bg-green-700 text-white"
            onClick={() => {
              setForm({ nombre: "", observaciones: "" });
              setEditId(null);
              setOpen(true);
            }}
          >
            + Nuevo
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative w-full max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Búsqueda rápida por Variable u Observaciones..."
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
              <TableHead>Variable</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-32 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVariables.length === 0 ? (
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
        <DialogContent className="max-w-md">
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
