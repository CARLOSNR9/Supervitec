"use client";

import { Bitacora } from "../types/bitacora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// ✅ IMPORTAR EL ICONO EYE
import { Search, RefreshCw, Pencil, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Stats {
  total: number;
  abiertas: number;
  cerradas: number;
  ultimaActualizada: Date | null;
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
  onGeneratePDF: (bitacora: Bitacora) => void;
  // ✅ NUEVA PROP
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
  onGeneratePDF,
  onView, // ✅ RECIBIR PROP
}: BitacoraTableProps) {
  return (
    <>
      {/* ENCABEZADO ADAPTABLE */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 xl:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0C2D57]">
            Informe de Bitácoras
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {bitacoras.length} de {stats.total} registros
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
          <Button onClick={onNew} className="bg-[#0C2D57] hover:bg-[#113a84] flex-1 xl:flex-none">
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
        {loading && <p className="text-sm text-gray-500 animate-pulse">Cargando...</p>}
      </div>

      {/* 📱 VISTA MÓVIL: TARJETAS */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {bitacoras.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No hay registros.</p>
        ) : (
          bitacoras.map((b) => (
            <Card key={b.id} className="shadow-sm border border-gray-200">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{b.obra?.nombre || "Sin Obra"}</h3>
                    <p className="text-xs text-gray-500">ID: {b.id}</p>
                  </div>
                  <Badge variant={b.estado === "ABIERTA" ? "default" : "destructive"}>
                    {b.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2 text-sm space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Responsable:</span>
                  <span className="font-medium text-right">{b.responsable?.nombreCompleto || "-"}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">Fecha:</span>
                  <span>{b.fechaCreacion ? new Date(b.fechaCreacion).toLocaleDateString() : "-"}</span>
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
                  {/* ✅ BOTÓN VER EN MÓVIL */}
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

      {/* 💻 VISTA ESCRITORIO: TABLA */}
      <div className="hidden md:block p-1 w-full">
        <div className="overflow-x-auto bg-white shadow-md rounded-2xl border border-gray-200">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#0C2D57] text-white text-left">
                <ThSortable label="ID" sortKey="id" sortConfig={sortConfig} onSort={onSort} />
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
              {bitacoras.length > 0 ? (
                bitacoras.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 border-b transition duration-100 text-sm">
                    <td className="px-4 py-3 text-gray-700">{b.id}</td>
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
                        {/* ✅ BOTÓN VER EN ESCRITORIO */}
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
                  <td colSpan={8} className="text-center py-6 text-gray-500">
                    No hay registros de bitácoras.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* ... (Paginación y Stats se mantienen igual) ... */}
          {/* QUICK STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-4 bg-gray-50 border-t">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Abiertas" value={stats.abiertas} className="text-green-600" />
            <StatCard label="Cerradas" value={stats.cerradas} className="text-rose-600" />
            <div className="bg-white p-2 rounded-md text-center border shadow-sm">
              <div className="text-[10px] uppercase tracking-wide text-gray-500">Última</div>
              <div className="text-[12px] font-semibold text-violet-700">
                {stats.ultimaActualizada
                  ? stats.ultimaActualizada.toLocaleDateString()
                  : "—"}
              </div>
            </div>
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
          <span className="text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
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