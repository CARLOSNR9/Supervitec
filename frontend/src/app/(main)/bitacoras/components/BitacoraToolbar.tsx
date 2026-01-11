"use client";

import type { Table } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";

import { X, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Si no usas estos, puedes borrarlos
// import { DataTableViewOptions } from "@/components/ui/data-table-view-options";

import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

interface BitacoraToolbarProps<TData> {
  /**
   * ✅ Opcional:
   * - Si usas TanStack, pásalo y se activan filtros por columnas.
   * - Si NO usas TanStack (tu caso actual en BitacoraTable HTML),
   *   NO lo pases y NO se rompe: solo mostrará buscador/fechas/botones.
   */
  table?: Table<TData>;

  /** Buscador */
  globalFilter: string;
  setGlobalFilter: (value: string) => void;

  /** Rango de fechas */
  dateRange?: DateRange;
  setDateRange: (range: DateRange | undefined) => void;

  /** Listas para los filtros (si hay table y columnas) */
  obras?: Option[];
  responsables?: Option[];

  /** ✅ Acciones globales (para integrarlo a tu BitacoraTable) */
  loading?: boolean;
  onRefresh?: () => void;
  onNew?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

export function BitacoraToolbar<TData>({
  table,
  globalFilter,
  setGlobalFilter,
  dateRange,
  setDateRange,
  obras = [],
  responsables = [],
  loading = false,
  onRefresh,
  onNew,
  onExportExcel,
  onPrint,
}: BitacoraToolbarProps<TData>) {
  const hasTable = !!table;

  // Si existe table, revisa filtros de columnas. Si no, solo global/dateRange.
  const hasColumnFilters = hasTable ? table.getState().columnFilters.length > 0 : false;

  const isFiltered = hasColumnFilters || !!globalFilter || !!dateRange?.from;

  const clearAll = () => {
    if (hasTable) table.resetColumnFilters();
    setGlobalFilter("");
    setDateRange(undefined);
  };

  const renderDateLabel = () => {
    if (!dateRange?.from) return <span>Fechas</span>;
    if (dateRange.to) {
      return (
        <>
          {format(dateRange.from, "dd/MM/y", { locale: es })} -{" "}
          {format(dateRange.to, "dd/MM/y", { locale: es })}
        </>
      );
    }
    return format(dateRange.from, "dd/MM/y", { locale: es });
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* Toolbar container */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* IZQUIERDA: Buscador + filtros */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-1">
            {/* BUSCADOR GENERAL */}
            <div className="w-full lg:w-[320px]">
              <Input
                placeholder="Buscar en todas las bitácoras..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-9 bg-white"
              />
            </div>

            {/* FILTROS (solo si hay table y columnas) */}
            <div className="flex flex-wrap items-center gap-2">
              {hasTable && table.getColumn("obra") && (
                <DataTableFacetedFilter
                  column={table.getColumn("obra")}
                  title="Obra"
                  options={obras}
                />
              )}

              {hasTable && table.getColumn("estado") && (
                <DataTableFacetedFilter
                  column={table.getColumn("estado")}
                  title="Estado"
                  options={[
                    { label: "Abierta", value: "ABIERTA" },
                    { label: "Cerrada", value: "CERRADA" },
                  ]}
                />
              )}

              {hasTable && table.getColumn("responsable") && (
                <DataTableFacetedFilter
                  column={table.getColumn("responsable")}
                  title="Responsable"
                  options={responsables}
                />
              )}

              {/* FECHAS (siempre visible) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-9 justify-start text-left font-normal border-dashed",
                      !dateRange?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {renderDateLabel()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>

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
          </div>

          {/* DERECHA: Botones globales (opcionales) */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                title="Refrescar"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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

        {/* Estado loading (opcional) */}
        {loading && (
          <p className="text-sm text-gray-500 animate-pulse mt-3">Cargando...</p>
        )}
      </div>
    </div>
  );
}
