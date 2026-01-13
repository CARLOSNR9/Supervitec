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
import { MapPin, User, FileText, Tag } from "lucide-react";

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

  // ✅ Fecha + Hora (12h AM/PM) en es-CO
  const formatDateTime = (dateString?: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);

    // Esto mostrará algo como: "13/01/2026, 10:45 a. m."
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // ✅ helper: fecha real de subida de foto = createdAt (fallback a fechaCreacion de la bitácora)
  const getEvidenceDateTime = (foto: any) =>
    formatDateTime(foto?.createdAt ?? data.fechaCreacion);

  const totalEvidencias =
    (data.evidencias?.length ?? 0) + (data.evidenciasSeguimiento?.length ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg p-0">
        <DialogHeader className="p-4 bg-gray-50 border-b sticky top-0 z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-[#0C2D57] text-xl">
              Detalle de Bitácora #{data.id}
            </DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              Creado el {formatDateTime(data.fechaCreacion)}
            </p>
          </div>
          <Badge
            className={data.estado === "ABIERTA" ? "bg-green-600" : "bg-red-600"}
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

              {/* Fecha Ejecución con hora */}
              <div>
                <span className="text-xs text-gray-500 block">
                  Fecha Ejecución
                </span>
                <span className="text-sm font-medium">
                  {formatDateTime(data.fechaEjecucion)}
                </span>
              </div>

              {/* Fecha Mejora con hora */}
              {data.fechaMejora && (
                <div>
                  <span className="text-xs text-gray-500 block">
                    Fecha Mejora
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatDateTime(data.fechaMejora)}
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

          {/* 4. EVIDENCIAS (FOTOS CON FECHA REAL DE SUBIDA) */}
          <div>
            <h3 className="font-semibold text-[#0C2D57] mb-3 border-b pb-1">
              Evidencias ({totalEvidencias})
            </h3>

            {totalEvidencias > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {/* 📸 Fotos Bitácora */}
                {data.evidencias?.map((foto) => (
                  <div
                    key={`bitacora-${foto.id}`}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={getImageUrl((foto as any).url)}
                      alt="Evidencia"
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                    />

                    {/* ✅ BARRA INFERIOR CON FECHA REAL 'createdAt' */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase">
                        Bitácora
                      </span>
                      <span className="text-[9px] text-gray-200">
                        {getEvidenceDateTime(foto)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* 📸 Fotos Seguimiento */}
                {data.evidenciasSeguimiento?.map((foto) => (
                  <div
                    key={`seguimiento-${foto.id}`}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                  >
                    <img
                      src={getImageUrl((foto as any).url)}
                      alt="Seguimiento"
                      className="object-cover w-full h-full hover:scale-105 transition-transform"
                    />

                    {/* ✅ BARRA INFERIOR CON FECHA REAL 'createdAt' */}
                    <div className="absolute bottom-0 left-0 right-0 bg-yellow-600/90 text-white p-1 text-center flex flex-col justify-center">
                      <span className="text-[10px] font-bold uppercase">
                        Seguimiento
                      </span>
                      <span className="text-[9px] text-gray-100">
                        {getEvidenceDateTime(foto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No hay fotos registradas.
              </p>
            )}
          </div>
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
