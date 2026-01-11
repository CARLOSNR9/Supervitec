"use client";

import { X, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DateRange = { from?: Date; to?: Date } | undefined;

interface BitacoraToolbarProps {
  // buscador
  globalFilter: string;
  setGlobalFilter: (value: string) => void;

  // fechas (sin popover/calendar)
  dateRange?: { from?: Date; to?: Date };
  setDateRange: (range: DateRange) => void;

  // acciones globales
  loading?: boolean;
  onRefresh?: () => void;
  onNew?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

function toDateInputValue(d?: Date) {
  if (!d) return "";
  // YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(v: string) {
  if (!v) return undefined;
  // evita problemas de TZ: construimos en local
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export function BitacoraToolbar({
  globalFilter,
  setGlobalFilter,
  dateRange,
  setDateRange,
  loading = false,
  onRefresh,
  onNew,
  onExportExcel,
  onPrint,
}: BitacoraToolbarProps) {
  const isFiltered = !!globalFilter || !!dateRange?.from || !!dateRange?.to;

  const clearAll = () => {
    setGlobalFilter("");
    setDateRange(undefined);
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* IZQUIERDA */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-1">
            {/* BUSCADOR */}
            <div className="w-full lg:w-[350px]">
              <Input
                placeholder="Buscar en todas las bitácoras..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="h-9 bg-white"
              />
              {loading && (
                <p className="text-sm text-gray-500 animate-pulse mt-2">
                  Cargando...
                </p>
              )}
            </div>

            {/* FECHAS (sin popover) */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Fechas</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="date"
                  className="h-9 w-full sm:w-[170px]"
                  value={toDateInputValue(dateRange?.from)}
                  onChange={(e) => {
                    const from = fromDateInputValue(e.target.value);
                    setDateRange({ from, to: dateRange?.to });
                  }}
                />
                <Input
                  type="date"
                  className="h-9 w-full sm:w-[170px]"
                  value={toDateInputValue(dateRange?.to)}
                  onChange={(e) => {
                    const to = fromDateInputValue(e.target.value);
                    setDateRange({ from: dateRange?.from, to });
                  }}
                />
              </div>
            </div>

            {/* LIMPIAR */}
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={clearAll}
                className="h-9 px-2 lg:px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                Limpiar filtros
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* DERECHA: BOTONES */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                title="Refrescar"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            )}

            {onNew && (
              <Button
                onClick={onNew}
                className="bg-[#0C2D57] hover:bg-[#113a84] flex-1 lg:flex-none"
              >
                + Nueva
              </Button>
            )}

            {onExportExcel && (
              <Button
                variant="outline"
                onClick={onExportExcel}
                className="text-green-700 border-green-300 hover:bg-green-50 flex-1 lg:flex-none"
              >
                📊 Excel
              </Button>
            )}

            {onPrint && (
              <Button
                variant="outline"
                onClick={onPrint}
                className="text-blue-700 border-blue-300 hover:bg-blue-50 flex-1 lg:flex-none"
              >
                🖨️ Imprimir
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
