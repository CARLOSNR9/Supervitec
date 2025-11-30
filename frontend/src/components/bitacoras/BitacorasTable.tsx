"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type BitacoraRow = {
  id: number;
  obraId: number;
  responsableId: number;
  variable: string;
  estado: string;
  fechaCreacion: string;
};

export default function BitacorasTable({ rows }: { rows: BitacoraRow[] }) {
  return (
    <div className="overflow-auto border rounded bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Obra</th>
            <th className="p-2 text-left">Responsable</th>
            <th className="p-2 text-left">Variable</th>
            <th className="p-2 text-left">Estado</th>
            <th className="p-2 text-left">Creación</th>
            <th className="p-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{r.id}</td>
              <td className="p-2">{r.obraId}</td>
              <td className="p-2">{r.responsableId}</td>
              <td className="p-2">{r.variable}</td>
              <td className="p-2">{r.estado}</td>
              <td className="p-2">{new Date(r.fechaCreacion).toLocaleDateString()}</td>
              <td className="p-2 text-right">
                <Link href={`/bitacoras/${r.id}`}>
                  <Button size="sm" variant="outline">Abrir</Button>
                </Link>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-gray-500">
                No hay registros
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
