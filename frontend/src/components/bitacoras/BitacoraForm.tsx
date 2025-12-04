"use client";

import { z } from "zod";
import { useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ✅ Esquema de validación (Ajustado para coerción estricta)
const schema = z.object({
  obraId: z.coerce.number({ invalid_type_error: "Obra inválida" }).int().positive({ message: "Seleccione una obra válida" }),
  responsableId: z.coerce.number({ invalid_type_error: "Responsable inválido" }).int().positive({ message: "Seleccione un responsable válido" }),
  variableId: z.coerce.number().optional(),
  medicionId: z.coerce.number().optional(),
  unidadId: z.coerce.number().optional(),
  fechaMejora: z.string().optional(),
  fechaEjecucion: z.string().optional(),
  ubicacion: z.string().optional(),
  observaciones: z.string().optional(),
});

// Inferir el tipo directamente del esquema para evitar desincronización
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
  // Usamos DefaultValues de RHF para compatibilidad estricta
  defaultValues?: DefaultValues<BitacoraFormData>; 
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
          toast.error(e.message ?? "Error al guardar");
        }
      })}
      className="grid gap-3"
    >
      {/* Obra y Responsable */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Obra ID</label>
          {/* Nota: Idealmente esto sería un Select de Obras, pero mantengo tu Input number */}
          <Input type="number" {...register("obraId")} />
          {errors.obraId && <p className="text-xs text-red-600 mt-1">{errors.obraId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Responsable ID</label>
          <Input type="number" {...register("responsableId")} />
          {errors.responsableId && <p className="text-xs text-red-600 mt-1">{errors.responsableId.message}</p>}
        </div>
      </div>

      {/* Variable */}
      <div>
        <label className="text-sm font-medium">Variable</label>
        <Select 
          // Si hay defaultValues, convertimos a string para que el Select lo muestre
          defaultValue={defaultValues?.variableId ? String(defaultValues.variableId) : undefined}
          onValueChange={(v) => setValue("variableId", Number(v), { shouldValidate: true })}
        >
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

      {/* Medición */}
      <div>
        <label className="text-sm font-medium">Medición</label>
        <Select 
          defaultValue={defaultValues?.medicionId ? String(defaultValues.medicionId) : undefined}
          onValueChange={(v) => setValue("medicionId", Number(v), { shouldValidate: true })}
        >
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
        <label className="text-sm font-medium">Unidad</label>
        <Select 
          defaultValue={defaultValues?.unidadId ? String(defaultValues.unidadId) : undefined}
          onValueChange={(v) => setValue("unidadId", Number(v), { shouldValidate: true })}
        >
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
          <label className="text-sm font-medium">Fecha Mejora</label>
          <Input type="date" {...register("fechaMejora")} />
        </div>
        <div>
          <label className="text-sm font-medium">Fecha Ejecución</label>
          <Input type="date" {...register("fechaEjecucion")} />
        </div>
      </div>

      {/* Ubicación */}
      <div>
        <label className="text-sm font-medium">Ubicación</label>
        <Input {...register("ubicacion")} />
      </div>

      {/* Observaciones */}
      <div>
        <label className="text-sm font-medium">Observaciones</label>
        <textarea 
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-24" 
          {...register("observaciones")} 
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full md:w-auto">
        {submitting ? "Guardando..." : "Guardar Bitácora"}
      </Button>
    </form>
  );
}