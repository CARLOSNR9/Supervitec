"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type OT = {
  id: number;
  obraId: number;
  responsableId: number;
  tipoTrabajo: string;
  identificacion: string;
  estado: string;
  fecha: string;
  numeroAuto?: string | null;
};

export default function OTListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ot"],
    queryFn: () => apiGet<OT[]>("/orden-trabajo"),
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Órdenes de Trabajo</h1>
        <Link href="/ot/new"><Button>+ Nueva OT</Button></Link>
      </div>

      {isLoading ? <p>Cargando...</p> : (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Obra</th>
                <th className="p-2 text-left">Responsable</th>
                <th className="p-2 text-left">Tipo</th>
                <th className="p-2 text-left">Identificación</th>
                <th className="p-2 text-left">Estado</th>
                <th className="p-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map(ot=>(
                <tr key={ot.id} className="border-t">
                  <td className="p-2">{ot.id}</td>
                  <td className="p-2">{ot.obraId}</td>
                  <td className="p-2">{ot.responsableId}</td>
                  <td className="p-2">{ot.tipoTrabajo}</td>
                  <td className="p-2">{ot.identificacion}</td>
                  <td className="p-2">{ot.estado}</td>
                  <td className="p-2">{new Date(ot.fecha).toLocaleDateString()}</td>
                </tr>
              ))}
              {(!data || !data.length) && (
                <tr><td className="p-6 text-center text-gray-500" colSpan={7}>Sin órdenes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
