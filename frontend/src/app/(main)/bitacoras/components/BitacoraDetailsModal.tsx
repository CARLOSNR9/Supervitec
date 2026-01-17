"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bitacora } from "../types/bitacora";
import {
  User,
  FileText,
  Tag,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

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
  // 1) Lógica para organizar las fotos VISUALMENTE
  const { fotosArriba, fotosAbajo, isNoConforme } = useMemo(() => {
    if (!data) return { fotosArriba: [], fotosAbajo: [], isNoConforme: false };

    const nombreVar =
      data.variable?.nombre?.toUpperCase().replace(/_/g, " ") || "";
    const esNoConforme =
      nombreVar.includes("NO CONFORME") || nombreVar.includes("SE RECOMIENDA");

    let arriba = data.evidencias || [];
    let abajo = data.evidenciasSeguimiento || [];

    // 🚨 TRUCO VISUAL: si es NO CONFORME y hay más de 3 fotos arriba,
    // movemos las sobrantes para abajo visualmente.
    if (esNoConforme && arriba.length > 3) {
      const sobrantes = arriba.slice(3);
      arriba = arriba.slice(0, 3);
      abajo = [...abajo, ...sobrantes];
    }

    return { fotosArriba: arriba, fotosAbajo: abajo, isNoConforme: esNoConforme };
  }, [data]);

  if (!data) return null;

  const getImageUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith("http")
      ? path
      : `${process.env.NEXT_PUBLIC_API_URL}${path}`;
  };

  // Formatear Fecha y Hora
  const formatDateTime = (dateString?: string | Date | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEvidenceDateTime = (foto: any) =>
    formatDateTime(foto?.createdAt ?? data.fechaCreacion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg p-0">
        <DialogHeader className="p-4 bg-gray-50 border-b sticky top-0 z-10">
          <div className="flex justify-between items-start gap-3">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold text-[#0C2D57] flex items-center gap-2 flex-wrap">
                Detalle de Bitácora {data.codigo ? data.codigo : `#${data.id}`}
                {data.codigo && (
                  <span className="text-base text-gray-500 font-normal">
                    | #{data.id}
                  </span>
                )}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Creado el {formatDateTime(data.fechaCreacion)}
              </p>
            </div>

            <Badge
              className={`text-sm px-3 py-1 ${data.estado === "ABIERTA" ? "bg-green-600" : "bg-red-600"
                }`}
            >
              {data.estado}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-8">
          {/* 1. FICHA TÉCNICA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  Responsable
                </p>
                <p className="font-medium text-gray-800">
                  {data.responsable?.nombreCompleto || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-full text-orange-600">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Obra</p>
                <p className="font-medium text-gray-800">
                  {data.obra?.nombre || "N/A"}
                </p>
                <p className="text-xs text-gray-400">
                  Prefijo: {data.obra?.prefijo || "Sin prefijo"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full ${isNoConforme
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                  }`}
              >
                <Tag size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  Variable
                </p>
                <p
                  className={`font-bold ${isNoConforme ? "text-red-700" : "text-gray-800"
                    }`}
                >
                  {data.variable?.nombre || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  Ubicación
                </p>
                <p className="font-medium text-gray-800">
                  {data.ubicacion || "No registrada"}
                </p>
                {data.latitud && data.longitud && (
                  <span className="text-[10px] text-gray-400">
                    {data.latitud}, {data.longitud}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. DATOS DE CONTROL */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
            <h3 className="text-xs font-bold text-[#0C2D57] uppercase tracking-wide mb-4 border-b pb-2">
              Datos de Control
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Medición</p>
                <p className="font-semibold text-gray-900">
                  {data.medicion?.nombre || "-"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Unidad</p>
                <p className="font-semibold text-gray-900">
                  {data.unidadRel?.nombre || "-"}
                </p>
              </div>

              {/* ✅ FECHA MEJORA con nowrap */}
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Fecha Compromiso / Mejora
                </p>
                <p className="font-bold text-orange-600 whitespace-nowrap">
                  {formatDateTime(data.fechaMejora)}
                </p>
              </div>

              {/* ✅ FECHA EJECUCIÓN con nowrap */}
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Fecha Real Ejecución
                </p>
                <p className="font-semibold text-gray-900 whitespace-nowrap">
                  {formatDateTime(data.fechaEjecucion)}
                </p>
              </div>
            </div>
          </div>

          {/* 3. OBSERVACIONES + FOTOS INICIALES (fotosArriba) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <AlertTriangle size={18} className="text-orange-500" />
              <h3 className="text-sm font-bold text-[#0C2D57]">
                Observaciones / Hallazgo
              </h3>
            </div>

            <div className="bg-blue-50/40 p-4 rounded-lg border border-blue-100 text-sm text-gray-700 leading-relaxed">
              {data.observaciones ? (
                data.observaciones
              ) : (
                <span className="italic text-gray-400">
                  Sin observaciones registradas.
                </span>
              )}
            </div>

            {fotosArriba.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                {fotosArriba.map((foto: any) => (
                  <div
                    key={foto.id}
                    className="relative aspect-square rounded-lg overflow-hidden border shadow-sm group bg-gray-100"
                  >
                    <img
                      src={getImageUrl(foto.url)}
                      alt="Evidencia Inicial"
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1 text-center flex items-center justify-center">
                      <span className="text-[10px] text-gray-100 font-medium">
                        {getEvidenceDateTime(foto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mt-2 pl-1">
                No hay fotos iniciales.
              </p>
            )}
          </div>

          {/* 4. SEGUIMIENTO + FOTOS CORRECCIÓN (fotosAbajo) */}
          {(data.seguimiento || fotosAbajo.length > 0) && (
            <div className="space-y-3 pt-4 border-t border-dashed">
              <div className="flex items-center gap-2 border-b pb-2">
                <CheckCircle2 size={18} className="text-green-600" />
                <h3 className="text-sm font-bold text-[#0C2D57]">
                  Seguimiento de Calidad / Corrección
                </h3>
              </div>

              <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 text-sm text-gray-700 leading-relaxed">
                {data.seguimiento ? (
                  data.seguimiento
                ) : (
                  <span className="italic text-gray-400">
                    Sin descripción de seguimiento.
                  </span>
                )}
              </div>

              {fotosAbajo.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-3">
                  {fotosAbajo.map((foto: any) => (
                    <div
                      key={foto.id}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-yellow-400 shadow-sm group bg-gray-100"
                    >
                      <img
                        src={getImageUrl(foto.url)}
                        alt="Corrección"
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-yellow-600/90 text-white p-1 text-center flex items-center justify-center">
                        <span className="text-[10px] text-gray-100 font-medium">
                          {getEvidenceDateTime(foto)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic mt-2 pl-1">
                  No hay fotos de corrección.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
