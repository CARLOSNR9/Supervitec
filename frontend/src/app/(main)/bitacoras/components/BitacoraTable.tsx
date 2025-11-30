// app/bitacoras/components/BitacoraTable.tsx
"use client";

import { Bitacora } from "../types/bitacora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Pencil } from "lucide-react";

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
  bitacoras: Bitacora[]; // paginadas
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
  onGeneratePDF: (bitacora: Bitacora) => void; // 👈 NUEVO
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
  onGeneratePDF, // 👈 NUEVO
}: BitacoraTableProps) {
  return (
    <>
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0C2D57]">
            Informe de Bitácoras
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {bitacoras.length} de {stats.total} registros
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            title="Refrescar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={onNew} className="bg-[#0C2D57] hover:bg-[#113a84]">
            + Nueva Bitácora
          </Button>
          <Button
            variant="outline"
            onClick={onExportExcel}
            className="text-green-700 border-green-300 hover:bg-green-50"
          >
            📊 Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={onPrint}
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
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
            placeholder="Buscar por Obra, Responsable, Registro o Contratista..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {loading && <p className="text-sm text-gray-500">Cargando...</p>}
      </div>

      {/* TABLA */}
      <div className="p-6 w-full">
        <div className="overflow-x-auto bg-white shadow-md rounded-2xl border border-gray-200">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#0C2D57] text-white text-left">
                <ThSortable label="ID" sortKey="id" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Obra" sortKey="obra" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Responsable" sortKey="responsable" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Estado" sortKey="estado" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Fecha de Creación" sortKey="fechaCreacion" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Variable" sortKey="variable" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Observaciones" sortKey="observaciones" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Medición" sortKey="medicion" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Unidad" sortKey="unidad" sortConfig={sortConfig} onSort={onSort} />
                <ThSortable label="Fecha de Ejecución" sortKey="fechaEjecucion" sortConfig={sortConfig} onSort={onSort} />
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {bitacoras.length > 0 ? (
                bitacoras.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 border-b transition duration-100">
                    <td className="px-4 py-3 text-gray-700">{b.id}</td>
                    <td className="px-4 py-3 font-medium">{b.obra?.nombre || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{b.responsable?.nombreCompleto || "—"}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        b.estado === "ABIERTA" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {b.estado}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.fechaCreacion ? new Date(b.fechaCreacion).toLocaleString("es-CO") : "—"}
                    </td>
                    <td className="px-4 py-3">{b.variable?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{b.observaciones || "—"}</td>
                    <td className="px-4 py-3">{b.medicion?.nombre ?? "—"}</td>
                    <td className="px-4 py-3">{b.unidadRel?.nombre ?? b.unidad ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.fechaEjecucion
                        ? new Date(b.fechaEjecucion).toLocaleDateString("es-CO")
                        : "—"}
                    </td>

                    {/* === ACCIONES === */}
                    <td className="px-4 py-3 text-center">
                      {/* EDITAR */}
                      <button
                        onClick={() => onEdit(b)}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Editar Bitácora"
                      >
                        <Pencil size={18} />
                      </button>

                      {/* EXPORTAR PDF */}
                      <button
                        onClick={() => onGeneratePDF(b)}
                        className="text-red-600 hover:text-red-800 ml-3 transition"
                        title="Exportar PDF"
                      >
                        🧾
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-gray-500">
                    No hay registros de bitácoras disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* QUICK STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Abiertas" value={stats.abiertas} className="text-green-600" />
            <StatCard label="Cerradas" value={stats.cerradas} className="text-rose-600" />
            <div className="bg-white p-2 rounded-md text-center border">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Última</div>
              <div className="text-[13px] font-semibold text-violet-700">
                {stats.ultimaActualizada
                  ? stats.ultimaActualizada.toLocaleString("es-CO")
                  : "—"}
              </div>
            </div>
          </div>

          {/* PAGINACIÓN */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  className="text-[#0C2D57]"
                >
                  ← Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                  className="text-[#0C2D57]"
                >
                  Siguiente →
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
      className="px-4 py-3 cursor-pointer select-none"
      onClick={() => onSort(sortKey)}
    >
      {label}{" "}
      {sortConfig.key === sortKey &&
        (sortConfig.direction === "asc" ? "▲" : "▼")}
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
    <div className="bg-white p-2 rounded-md text-center border">
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`text-lg font-bold ${className}`}>{value}</div>
    </div>
  );
}
