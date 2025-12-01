"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/* ---------------------------------------------------------
   🎯 SCHEMA — Convierte strings → number automáticamente  
--------------------------------------------------------- */
const schema = z.object({
  obraId: z.coerce.number().int().positive(),
  responsableId: z.coerce.number().int().positive(),
  tipoTrabajo: z.string().min(2),
  identificacion: z.string().min(2),
  numeroAuto: z.string().optional(),
});

/* ---------------------------------------------------------
   🎯 FormData — El tipo correcto para React Hook Form  
   Usa z.input para evitar conflictos con el resolver.
--------------------------------------------------------- */
type FormData = z.input<typeof schema>;

export default function NewOTPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const router = useRouter();

  async function onSubmit(data: FormData) {
    // 🔥 Aquí Zod YA transformó strings → numbers
    await apiPost("/orden-trabajo", data);
    toast.success("OT creada");
    router.push("/ot");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Nueva Orden de Trabajo</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 max-w-xl">
        
        {/* Obra + Responsable */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Obra ID</label>
            <Input {...register("obraId")} />
            {errors.obraId && <p className="text-red-600 text-xs">{errors.obraId.message}</p>}
          </div>

          <div>
            <label className="text-sm">Responsable ID</label>
            <Input {...register("responsableId")} />
            {errors.responsableId && <p className="text-red-600 text-xs">{errors.responsableId.message}</p>}
          </div>
        </div>

        {/* Tipo de trabajo */}
        <div>
          <label className="text-sm">Tipo de trabajo</label>
          <Input {...register("tipoTrabajo")} />
          {errors.tipoTrabajo && (
            <p className="text-red-600 text-xs">{errors.tipoTrabajo.message}</p>
          )}
        </div>

        {/* Identificación */}
        <div>
          <label className="text-sm">Identificación del elemento</label>
          <Input {...register("identificacion")} />
          {errors.identificacion && (
            <p className="text-red-600 text-xs">{errors.identificacion.message}</p>
          )}
        </div>

        {/* Número Auto */}
        <div>
          <label className="text-sm">Número Auto (opcional)</label>
          <Input {...register("numeroAuto")} />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </form>
    </div>
  );
}
