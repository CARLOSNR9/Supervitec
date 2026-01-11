"use client";

import type { DateRange } from "react-day-picker";
import { X, Calendar as CalendarIcon, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

interface BitacoraToolbarProps {
  // buscador
  globalFilter: string;
  setGlobalFilter: (value: string) => void;

  // fechas
  dateRange?: DateRange;
  setDateRange: (range: DateRange | undefined) => void;

  // listas (opcionales para futuro)
  obras?: Option[];
  responsables?: Option[];

  // acciones globales
  loading?: boolean;
  onRefresh?: () => void;
  onNew?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
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
  const isFiltered = !!globalFilter || !!dateRange?.from;

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
                <p className="text-sm text-gray-500 animate-pulse mt-2">Cargando...</p>
              )}
            </div>

            {/* FECHAS */}
            <div className="flex flex-wrap items-center gap-2">
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
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/y", { locale: es })} -{" "}
                          {format(dateRange.to, "dd/MM/y", { locale: es })}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/y", { locale: es })
                      )
                    ) : (
                      <span>Fechas</span>
                    )}
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
                  onClick={() => {
                    setGlobalFilter("");
                    setDateRange(undefined);
                  }}
                  className="h-9 px-2 lg:px-3 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Limpiar filtros
                  <X className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* DERECHA: BOTONES */}
          <div className="flex flex-wrap gap-2 w-full lg:w-auto lg:justify-end">
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} disabled={loading} title="Refrescar">
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
      </div>
    </div>
  );
}
