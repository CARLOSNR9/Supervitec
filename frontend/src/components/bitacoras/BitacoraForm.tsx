"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ Esquema de validación
const schema = z.object({
  obraId: z.coerce.number().int().positive({ message: "Seleccione una obra válida" }),
  responsableId: z.coerce.number().int().positive({ message: "Seleccione un responsable válido" }),
  variableId: z.coerce.number().int().optional(),
  medicionId: z.coerce.number().int().optional(),
  unidadId: z.coerce.number().int().optional(),
  fechaMejora: z.string().optional(),
  fechaEjecucion: z.string().optional(),
  ubicacion: z.string().optional(),
  observaciones: z.string().optional(),
});

export type BitacoraFormData = z.infer<typeof schema>;

// 🧩 Función auxiliar para obtener datos del backend
async function fetchData<T>(endpoint: string): Promise<T[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}${endpoint}`);
  if (!res.ok) throw new Error(`Error al cargar ${endpoint}`);
  return res.json();
}

export default function BitacoraForm({
  defaultValues,
  onSubmit,
  submitting,
}: {
  defaultValues?: Partial<BitacoraFormData>;
  onSubmit: (data: BitacoraFormData) => Promise<void>;
  submitting?: boolean;
}) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BitacoraFormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // 🚀 Estados locales para datos dinámicos
  const [variables, setVariables] = useState<any[]>([]);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);

  // ✅ Cargar listas dinámicas
  useEffect(() => {
    Promise.all([
      fetchData("/variables"),
      fetchData("/mediciones"),
      fetchData("/unidades"),
    ])
      .then(([vars, meds, unis]) => {
        setVariables(vars);
        setMediciones(meds);
        setUnidades(unis);
      })
      .catch((err) => toast.error("Error al cargar listas: " + err.message));
  }, []);

  return (
    <form
      onSubmit={handleSubmit(async (data) => {
        try {
          await onSubmit(data);
        } catch (e: any) {
          toast.error(e.message ?? "Error");
        }
      })}
      className="grid gap-3"
    >
      {/* Obra y Responsable */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Obra ID</label>
          <Input type="number" {...register("obraId")} />
          {errors.obraId && <p className="text-xs text-red-600">{errors.obraId.message}</p>}
        </div>
        <div>
          <label className="text-sm">Responsable ID</label>
          <Input type="number" {...register("responsableId")} />
          {errors.responsableId && <p className="text-xs text-red-600">{errors.responsableId.message}</p>}
        </div>
      </div>

      {/* Variable */}
      <div>
        <label className="text-sm">Variable</label>
        <Select onValueChange={(v) => setValue("variableId", Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Seleccionar Variable --" />
          </SelectTrigger>
          <SelectContent>
            {variables.map((v) => (
              <SelectItem key={v.id} value={String(v.id)}>
                {v.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Medición (antes Registro) */}
      <div>
        <label className="text-sm">Medición</label>
        <Select onValueChange={(v) => setValue("medicionId", Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Seleccionar Medición --" />
          </SelectTrigger>
          <SelectContent>
            {mediciones.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Unidad */}
      <div>
        <label className="text-sm">Unidad</label>
        <Select onValueChange={(v) => setValue("unidadId", Number(v))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="-- Seleccionar Unidad --" />
          </SelectTrigger>
          <SelectContent>
            {unidades.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Fecha Mejora</label>
          <Input type="date" {...register("fechaMejora")} />
        </div>
        <div>
          <label className="text-sm">Fecha Ejecución</label>
          <Input type="date" {...register("fechaEjecucion")} />
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <label className="text-sm">Ubicación</label>
        <Input {...register("ubicacion")} />
      </div>

      {/* Observaciones */}
      <div>
        <label className="text-sm">Observaciones</label>
        <textarea className="w-full border rounded p-2 min-h-24" {...register("observaciones")} />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
