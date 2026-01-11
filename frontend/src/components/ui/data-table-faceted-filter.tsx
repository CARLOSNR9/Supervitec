"use client";

import * as React from "react";

/**
 * ✅ STUB (sin shadcn Command/Popover/Separator y sin TanStack)
 * Esto evita que el build falle mientras no tengas esos componentes instalados.
 */

type Option = {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
};

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: any;
  title?: string;
  options: Option[];
  values?: string[];
  onChange?: (values: string[]) => void;
}

export function DataTableFacetedFilter<TData, TValue>(
  _props: DataTableFacetedFilterProps<TData, TValue>
) {
  return null;
}
