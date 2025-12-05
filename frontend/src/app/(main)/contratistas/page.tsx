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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Agregamos 'HardHat' como icono de contratista
import { Search, RefreshCw, Pencil, Trash2, HardHat, Mail, User } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// ---------------------------------------------------------------------
// TIPOS Y ESQUEMA DE VALIDACIÓN (ZOD)
// ---------------------------------------------------------------------

interface Contratista {
  id: number;
  nombre: string;
  responsable?: string;
  email?: string;
  observaciones?: string;
}

const ContratistaSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio.").max(100),
  responsable: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Debe ser un correo electrónico válido.").optional().or(z.literal("")),
  observaciones: z.string().max(500).optional().or(z.literal("")),
});

type ContratistaForm = z.infer<typeof ContratistaSchema>;

const initialFormState: ContratistaForm = {
  nombre: "",
  responsable: "",
  email: "",
  observaciones: "",
};

// ---------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------

export default function ContratistasPage() {
  const [contratistas, setContratistas] = useState<Contratista[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ContratistaForm>(initialFormState);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // ---------------------------------------------------------------------
  // CARGA DE DATOS
  // ---------------------------------------------------------------------

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const contratistasRes: Contratista[] = await apiGet("/contratistas");
      setContratistas(contratistasRes);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar la lista de Contratistas.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // LÓGICA DEL MODAL Y FORMULARIO
  // ---------------------------------------------------------------------

  const handleOpenRegister = () => {
    setForm(initialFormState);
    setIsEditing(null);
    setOpen(true);
  };

  const handleEdit = (contratista: Contratista) => {
    setForm({
      nombre: contratista.nombre,
      responsable: contratista.responsable || "",
      email: contratista.email || "",
      observaciones: contratista.observaciones || "",
    });
    setIsEditing(contratista.id);
    setOpen(true);
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este contratista?")) return;

    try {
      await apiDelete(`/contratistas/${id}`);
      toast.success("❌ Contratista eliminado exitosamente.");
      fetchData();
    } catch (err: any) {
      console.error("Error eliminando contratista:", err);
      const detail = err.response?.data?.message || "No se pudo eliminar el contratista.";
      toast.error(`❌ Error: ${Array.isArray(detail) ? detail.join(" | ") : detail}`);
    }
  };

  const handleSubmit = async () => {
    try {
      const validatedData = ContratistaSchema.parse(form);
      setLoading(true);

      if (isEditing) {
        await apiPatch(`/contratistas/${isEditing}`, validatedData);
        toast.success(`✅ Contratista "${validatedData.nombre}" actualizado exitosamente.`);
      } else {
        await apiPost("/contratistas", validatedData);
        toast.success(`✅ Contratista "${validatedData.nombre}" creado exitosamente.`);
      }

      setOpen(false);
      setForm(initialFormState);
      fetchData();
    } catch (err: any) {
      console.log(err);
      let errorMessages = ["Error al guardar el contratista."];
      if (err.issues) {
        errorMessages = err.issues.map((issue: any) => `${issue.path[0]}: ${issue.message}`);
      } else if (err.response?.data?.message) {
        errorMessages = Array.isArray(err.response.data.message) 
            ? err.response.data.message 
            : [err.response.data.message];
      }

      toast.error(
        <div className="flex flex-col">
            <span className="font-bold">❌ Error al guardar:</span>
            {errorMessages.map((msg, index) => (
                <span key={index} className="text-sm mt-1">{msg}</span>
            ))}
        </div>,
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  // FILTRO DE BÚSQUEDA
  // ---------------------------------------------------------------------

  const filteredContratistas = useMemo(() => {
    if (!searchTerm) return contratistas;
    const term = searchTerm.toLowerCase();
    return contratistas.filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.responsable?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.observaciones?.toLowerCase().includes(term)
    );
  }, [contratistas, searchTerm]);

  // ---------------------------------------------------------------------
  // RENDERIZADO
  // ---------------------------------------------------------------------

  return (
    // ✅ Padding responsivo
    <main className="p-4 md:p-8">
      {/* ENCABEZADO ADAPTABLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 md:gap-0">
        <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
          Informe de Contratistas
        </h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            title="Refrescar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={handleOpenRegister}
            className="bg-[#0C2D57] hover:bg-[#113a84] flex-1 md:flex-none"
          >
            + Nuevo Contratista
          </Button>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por Nombre, Responsable, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {loading && <p className="text-sm text-gray-500 animate-pulse">Cargando datos...</p>}
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredContratistas.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No se encontraron registros.</p>
        ) : (
          filteredContratistas.map((c) => (
            <Card key={c.id} className="shadow-sm border border-gray-200">
              <CardHeader className="pb-2 flex flex-row justify-between items-center">
                <div className="flex items-center gap-3 w-full">
                  <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                    <HardHat className="h-5 w-5 text-blue-800" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-semibold text-gray-800 text-lg truncate">{c.nombre}</h3>
                    <p className="text-xs text-gray-400">ID: {c.id}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Resp:</span> 
                  <span>{c.responsable || "N/A"}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{c.email || "N/A"}</span>
                </div>

                {c.observaciones && (
                  <div className="bg-gray-50 p-2 rounded text-gray-600 text-xs italic mt-2">
                    "{c.observaciones}"
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 border-t mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleEdit(c)}
                  >
                    <Pencil className="h-4 w-4 mr-2 text-blue-600" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleDelete(c.id)}
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
          <TableHeader className="bg-gray-100 text-gray-700 text-left">
            <TableRow>
              <TableHead className="w-[80px]">Id</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContratistas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No se encontraron registros de Contratistas.
                </TableCell>
              </TableRow>
            ) : (
              filteredContratistas.map((c) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <TableCell className="font-medium">{c.id}</TableCell>
                  <TableCell className="font-medium text-[#0C2D57]">{c.nombre}</TableCell>
                  <TableCell>{c.responsable || 'N/A'}</TableCell>
                  <TableCell>{c.email || 'N/A'}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={c.observaciones}>{c.observaciones || 'Sin observaciones'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(c)}
                            title="Editar Contratista"
                        >
                            <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDelete(c.id)}
                            title="Eliminar Contratista"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL CREAR/EDITAR CONTRATISTA */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-[95%] rounded-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Registro de Contratista" : "Nuevo Registro de Contratista"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4">
            {/* Nombre */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Nombre *</span>
              <Input
                placeholder="Nombre de la empresa contratista"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </label>

            {/* Responsable */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Responsable</span>
              <Input
                placeholder="Nombre del contacto clave"
                value={form.responsable}
                onChange={(e) => setForm({ ...form, responsable: e.target.value })}
              />
            </label>
            
            {/* Email */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Email</span>
              <Input
                type="email"
                placeholder="Correo electrónico de contacto"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            {/* Observaciones */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Observaciones</span>
              <Textarea
                placeholder="Descripción del trabajo o notas relevantes"
                value={form.observaciones}
                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                className="h-24"
              />
            </label>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-4 bg-[#0C2D57] hover:bg-[#113a84] w-full"
          >
            {loading ? "Guardando..." : (isEditing ? "Guardar Cambios" : "Agregar")}
          </Button>
          
        </DialogContent>
      </Dialog>
    </main>
  );
}