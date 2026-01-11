"use client";

import * as React from "react";
import { Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/**
 * ✅ Reemplazo de Column de TanStack:
 * Solo definimos lo mínimo que tu componente usa.
 * Si NO usas TanStack, puedes pasar column={undefined} y no se rompe.
 */
type MinimalColumn<TValue> = {
  getFacetedUniqueValues?: () => Map<string, number>;
  getFilterValue?: () => unknown;
  setFilterValue?: (value: unknown) => void;
};

interface DataTableFacetedFilterProps<TData, TValue> {
  /**
   * ✅ Antes: Column<TData, TValue> (TanStack)
   * ✅ Ahora: MinimalColumn<TValue> (sin dependencia)
   *
   * - Si estás usando TanStack y más adelante lo instalas, podrás adaptar el tipo.
   * - Mientras tanto, NO rompe el build.
   */
  column?: MinimalColumn<TValue>;

  title?: string;

  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];

  /**
   * ✅ Extra (opcional):
   * Si NO tienes TanStack, puedes controlar el filtro desde fuera.
   * - values: valores seleccionados
   * - onChange: callback cuando cambien
   *
   * Si no lo pasas, el componente funciona visualmente y,
   * si existe column?.setFilterValue, actualiza esa columna.
   */
  values?: string[];
  onChange?: (values: string[]) => void;
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  values,
  onChange,
}: DataTableFacetedFilterProps<TData, TValue>) {
  // Facets: si la columna existe y tiene faceted values
  const facets = column?.getFacetedUniqueValues?.();

  // Selected values:
  // - Si te pasan values (modo controlado), lo usamos.
  // - Si no, lo obtenemos de column?.getFilterValue()
  const selectedValues = React.useMemo(() => {
    const fromProps = values ?? [];
    if (values) return new Set(fromProps);

    const raw = column?.getFilterValue?.();
    const arr = Array.isArray(raw) ? (raw as string[]) : [];
    return new Set(arr);
  }, [values, column]);

  const applySelection = (next: Set<string>) => {
    const list = Array.from(next);

    // ✅ Si hay callback externo, lo usamos
    if (onChange) onChange(list);

    // ✅ Si hay columna "tipo TanStack", también lo seteamos
    if (column?.setFilterValue) {
      column.setFilterValue(list.length ? list : undefined);
    }
  };

  const clearSelection = () => {
    if (onChange) onChange([]);
    if (column?.setFilterValue) column.setFilterValue(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-dashed text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />

              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>

              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal bg-blue-100 text-blue-800"
                  >
                    {selectedValues.size} seleccionados
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="rounded-sm px-1 font-normal bg-blue-100 text-blue-800"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      const next = new Set(selectedValues);
                      if (isSelected) next.delete(option.value);
                      else next.add(option.value);
                      applySelection(next);
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-[#0C2D57] text-white border-[#0C2D57]"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>

                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}

                    <span>{option.label}</span>

                    {facets?.get(option.value) ? (
                      <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs">
                        {facets.get(option.value)}
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={clearSelection}
                    className="justify-center text-center"
                  >
                    Limpiar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
