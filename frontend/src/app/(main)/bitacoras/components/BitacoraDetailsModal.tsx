"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bitacora } from "../types/bitacora";
import { Calendar, MapPin, User, FileText, Tag } from "lucide-react";

interface BitacoraDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Bitacora | null;
}

export default function BitacoraDetailsModal({
  open,
  onOpenChange,
  data,
}: BitacoraDetailsModalProps) {
  if (!data) return null;

const getImageUrl = (path: string) => {
  if (!path) return "";
  return path.startsWith("http")
    ? path
    : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
};





  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg p-0">
        <DialogHeader className="p-4 bg-gray-50 border-b sticky top-0 z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-[#0C2D57] text-xl">
              Detalle de Bitácora #{data.id}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              Creado el {data.fechaCreacion ? new Date(data.fechaCreacion).toLocaleString("es-CO") : "-"}
            </p>
          </div>
          <Badge
            className={
              data.estado === "ABIERTA" ? "bg-green-600" : "bg-red-600"
            }
          >
            {data.estado}
          </Badge>
        </DialogHeader>

        <div className="p-4 space-y-6">
          {/* 1. INFORMACIÓN PRINCIPAL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem
              icon={<User className="text-blue-600" />}
              label="Responsable"
              value={data.responsable?.nombreCompleto}
            />
            <InfoItem
              icon={<FileText className="text-orange-600" />}
              label="Obra"
              value={data.obra?.nombre}
              subValue={`Prefijo: ${data.obra?.prefijo}`}
            />
            <InfoItem
              icon={<Tag className="text-green-600" />}
              label="Variable"
              value={data.variable?.nombre}
            />
            <InfoItem
              icon={<MapPin className="text-red-600" />}
              label="Ubicación"
              value={data.ubicacion}
              subValue={
                data.latitud && data.longitud
                  ? `GPS: ${data.latitud}, ${data.longitud}`
                  : undefined
              }
            />
          </div>

          {/* 2. DATOS TÉCNICOS */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-[#0C2D57] mb-3 text-sm">
              Datos Técnicos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500 block">Medición</span>
                <span className="text-sm font-medium">
                  {data.medicion?.nombre || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Unidad</span>
                <span className="text-sm font-medium">
                  {data.unidadRel?.nombre || data.unidad || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Fecha Ejecución</span>
                <span className="text-sm font-medium">
                  {data.fechaEjecucion
                    ? new Date(data.fechaEjecucion).toLocaleDateString()
                    : "-"}
                </span>
              </div>
              {data.fechaMejora && (
                <div>
                  <span className="text-xs text-gray-500 block">
                    Fecha Mejora
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {new Date(data.fechaMejora).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. OBSERVACIONES Y SEGUIMIENTO */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[#0C2D57] mb-1 text-sm">
                Observaciones
              </h3>
              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md border border-blue-100">
                {data.observaciones || "Sin observaciones."}
              </p>
            </div>

            {data.seguimiento && (
              <div>
                <h3 className="font-semibold text-[#0C2D57] mb-1 text-sm">
                  Seguimiento
                </h3>
                <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                  {data.seguimiento}
                </p>
              </div>
            )}
          </div>

          {/* 4. EVIDENCIAS FOTOGRÁFICAS */}
          <div>
            <h3 className="font-semibold text-[#0C2D57] mb-3 border-b pb-1">
              Evidencias ({data.evidencias?.length || 0})
            </h3>
            {data.evidencias && data.evidencias.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.evidencias.map((foto) => (
                  <div
                    key={foto.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={getImageUrl(foto.url)}
                      alt="Evidencia"
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No hay fotos registradas.</p>
            )}
          </div>

          {/* 5. EVIDENCIAS SEGUIMIENTO */}
          {data.evidenciasSeguimiento && data.evidenciasSeguimiento.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#0C2D57] mb-3 border-b pb-1">
                Evidencias de Seguimiento
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {data.evidenciasSeguimiento.map((foto) => (
                  <div
                    key={foto.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={getImageUrl(foto.url)}
                      alt="Evidencia Seguimiento"
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente auxiliar para ítems de información
function InfoItem({
  icon,
  label,
  value,
  subValue,
}: {
  icon: any;
  label: string;
  value?: string;
  subValue?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 transition">
      <div className="mt-1 bg-white p-2 rounded-full border shadow-sm">
        {/* ✅ CORRECCIÓN AQUÍ: Usamos 'as any' para evitar el error de TypeScript sobre 'size' */}
        {React.cloneElement(icon as any, { size: 16 })}
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800 break-words">
          {value || "—"}
        </p>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
      </div>
    </div>
  );
}