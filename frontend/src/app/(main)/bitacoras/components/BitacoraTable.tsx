"use client";

import { useMemo } from "react";
import { Bitacora } from "../types/bitacora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Pencil, Eye, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  total: number;
  abiertas: number;
  cerradas: number;
  creadasHoy: number;
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface BitacoraTableProps {
  bitacoras: Bitacora[];
  stats: Stats;
  sortConfig: SortConfig;
  onSort: (key: string) => void;

  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  loading: boolean;
  onRefresh: () => void;
  onNew: () => void;
  onExportExcel: () => void;
  onPrint: () => void;

  searchTerm: string;
  onSearchChange: (value: string) => void;

  onEdit: (bitacora: Bitacora) => void;
  onGenerateExcel: (bitacora: Bitacora) => void;
  onGeneratePDF: (bitacora: Bitacora) => void;
  onView: (bitacora: Bitacora) => void;
}

export default function BitacoraTable({
  bitacoras,
  stats,
  sortConfig,
  onSort,
  currentPage,
  totalPages,
  onPageChange,
  loading,
  onRefresh,
  onNew,
  onExportExcel,
  onPrint,
  searchTerm,
  onSearchChange,
  onEdit,
  onGenerateExcel,
  onGeneratePDF,
  onView,
}: BitacoraTableProps) {
  // ✅ FUNCIÓN PARA ORDENAR POR COLUMNA (incluye "codigo")
  const getSortableValue = (row: Bitacora, key: string) => {
    switch (key) {
      case "codigo": // 🔥 NUEVO
        return row.codigo ?? "";

      case "obra":
        return row.obra?.nombre ?? "";
      case "responsable":
        return row.responsable?.nombreCompleto ?? "";
      case "variable":
        return row.variable?.nombre ?? "";
      case "medicion":
        return row.medicion?.nombre ?? "";
      case "unidad":
        return row.unidadRel?.nombre ?? row.unidad ?? "";
      case "estado":
        return row.estado ?? "";
      case "fechaCreacion":
        return row.fechaCreacion ?? "";
      case "fechaEjecucion":
        return row.fechaEjecucion ?? "";
      case "id":
        return row.id;
      default:
        // @ts-ignore
        return row[key] ?? "";
    }
  };

  // ✅ ORDENAMIENTO (si ya lo tenías, esto mantiene el patrón)
  const sortedBitacoras = useMemo(() => {
    if (!sortConfig?.key) return bitacoras;

    const rows = [...bitacoras];
    const direction = sortConfig.direction === "asc" ? 1 : -1;
    const key = sortConfig.key;

    rows.sort((a, b) => {
      const va = getSortableValue(a, key);
      const vb = getSortableValue(b, key);

      // números
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * direction;
      }

      // fechas ISO (cuando aplica)
      if (
        (key === "fechaCreacion" || key === "fechaEjecucion") &&
        typeof va === "string" &&
        typeof vb === "string"
      ) {
        const ta = va ? new Date(va).getTime() : 0;
        const tb = vb ? new Date(vb).getTime() : 0;
        return (ta - tb) * direction;
      }

      // strings (incluye codigo tipo UP1-01)
      return (
        String(va).localeCompare(String(vb), "es", {
          numeric: true,
          sensitivity: "base",
        }) * direction
      );
    });

    return rows;
  }, [bitacoras, sortConfig]);

  return (
    <>
      {/* ENCABEZADO ADAPTABLE */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 xl:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
            Informe de Bitácoras
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {sortedBitacoras.length} de {stats.total} registros
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            title="Refrescar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={onNew}
            className="bg-[#0C2D57] hover:bg-[#113a84] flex-1 xl:flex-none"
          >
            + Nueva
          </Button>
          <Button
            variant="outline"
            onClick={onExportExcel}
            className="text-green-700 border-green-300 hover:bg-green-50 flex-1 xl:flex-none"
          >
            📊 Excel
          </Button>
          <Button
            variant="outline"
            onClick={onPrint}
            className="text-blue-700 border-blue-300 hover:bg-blue-50 flex-1 xl:flex-none"
          >
            🖨️ Imprimir
          </Button>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por Obra, Responsable..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {loading && (
          <p className="text-sm text-gray-500 animate-pulse">Cargando...</p>
        )}
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {sortedBitacoras.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No hay registros.</p>
        ) : (
          sortedBitacoras.map((b) => (
            <Card key={b.id} className="shadow-sm border border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">
                      {b.obra?.nombre || "Sin Obra"}
                    </h3>
                    <p className="text-xs text-gray-500">ID: {b.id}</p>
                  </div>
                  <Badge
                    variant={b.estado === "ABIERTA" ? "default" : "destructive"}
                  >
                    {b.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Responsable:</span>
                  <span className="font-medium text-right">
                    {b.responsable?.nombreCompleto || "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Fecha:</span>
                  <span>
                    {b.fechaCreacion
                      ? new Date(b.fechaCreacion).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Variable:</span>
                  <span className="text-right">{b.variable?.nombre || "-"}</span>
                </div>

                {b.observaciones && (
                  <div className="bg-gray-50 p-2 rounded text-gray-600 text-xs italic mt-1">
                    "{b.observaciones}"
                  </div>
                )}

                <div className="flex gap-2 pt-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-gray-700 border-gray-200 hover:bg-gray-100"
                    onClick={() => onView(b)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> Ver
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                    onClick={() => onEdit(b)}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Editar
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                    onClick={() => onGenerateExcel(b)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> XLS
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => onGeneratePDF(b)}
                  >
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 📱 PAGINACIÓN MÓVIL */}
      <div className="md:hidden mt-4 pb-8 px-2">
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Anterior
            </Button>
            <span className="text-xs text-gray-500 font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* 💻 VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block p-1 w-full">
        <div className="overflow-x-auto bg-white shadow-md rounded-2xl border border-gray-200">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#0C2D57] text-white text-left">
                <ThSortable label="ID" sortKey="id" sortConfig={sortConfig} onSort={onSort} />

                {/* 🔥 NUEVO: CÓDIGO */}
                <ThSortable label="Cód." sortKey="codigo" sortConfig={sortConfig} onSort={onSort} />

                <ThSortable label="Obra" sortKey="obra" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Responsable" sortKey="responsable" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Estado" sortKey="estado" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Fecha" sortKey="fechaCreacion" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Variable" sortKey="variable" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Observaciones" sortKey="observaciones" sortConfig={sortConfig} onSort={onSort} />
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {sortedBitacoras.length > 0 ? (
                sortedBitacoras.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 border-b transition duration-100 text-sm">
                    <td className="px-4 py-3 text-gray-700">{b.id}</td>

                    {/* 🔥 NUEVO: CELDA CÓDIGO */}
                    <td className="px-4 py-3 font-bold text-[#0C2D57] whitespace-nowrap">
                      {b.codigo || "—"}
                    </td>

                    <td className="px-4 py-3 font-medium max-w-[150px] truncate" title={b.obra?.nombre}>
                      {b.obra?.nombre || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">
                      {b.responsable?.nombreCompleto || "—"}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${b.estado === "ABIERTA" ? "text-green-600" : "text-red-600"}`}>
                      {b.estado}
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {b.fechaCreacion ? new Date(b.fechaCreacion).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[120px] truncate">{b.variable?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate" title={b.observaciones || ""}>
                      {b.observaciones || "—"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onView(b)}
                          className="text-gray-600 hover:text-gray-900 transition bg-gray-100 p-1.5 rounded-md hover:bg-gray-200"
                          title="Ver Detalle"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          onClick={() => onEdit(b)}
                          className="text-blue-600 hover:text-blue-800 transition bg-blue-50 p-1.5 rounded-md hover:bg-blue-100"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          onClick={() => onGenerateExcel(b)}
                          className="text-green-600 hover:text-green-800 transition bg-green-50 p-1.5 rounded-md hover:bg-green-100"
                          title="Excel Individual"
                        >
                          <FileSpreadsheet size={18} />
                        </button>

                        <button
                          onClick={() => onGeneratePDF(b)}
                          className="text-red-600 hover:text-red-800 transition bg-red-50 p-1.5 rounded-md hover:bg-red-100"
                          title="PDF"
                        >
                          🧾
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  {/* Antes colSpan={8}; ahora hay 1 columna extra */}
                  <td colSpan={9} className="text-center py-6 text-gray-500">
                    No hay registros de bitácoras.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-4 bg-gray-50 border-t">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Abiertas" value={stats.abiertas} className="text-green-600" />
            <StatCard label="Cerradas" value={stats.cerradas} className="text-rose-600" />
            <StatCard label="Creadas Hoy" value={stats.creadasHoy} className="text-violet-700" />
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t bg-white">
              <p className="text-xs text-gray-600">
                Pág {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface ThSortableProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

function ThSortable({ label, sortKey, sortConfig, onSort }: ThSortableProps) {
  return (
    <th
      className="px-4 py-3 cursor-pointer select-none whitespace-nowrap text-sm hover:bg-[#0f386e] transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig.key === sortKey && (
          <span className="text-xs">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="bg-white p-2 rounded-md text-center border shadow-sm">
      <div className="text-[10px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`text-lg font-bold ${className}`}>{value}</div>
    </div>
  );
}
