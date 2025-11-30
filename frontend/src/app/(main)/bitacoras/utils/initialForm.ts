// app/bitacoras/utils/initialForm.ts
import { format } from "date-fns";
import { FormState } from "../types/bitacora";

export const createInitialFormState = (): FormState => ({
  obraId: "",
  contratistaId: "",
  variableId: "",
  medicionId: "",
  unidadId: "",
  estado: "ABIERTA",

  fechaCreacion: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  fechaMejora: "",
  fechaEjecucion: "",

  ubicacion: "",
  observaciones: "",
  seguimiento: "",

  latitud: "",
  longitud: "",

  fotoFiles: [],
  fotosSeguimiento: [],

  // 🔥 MUY IMPORTANTE (antes no existían)
  fotosExistentes: [],
  fotosSeguimientoExistentes: [],
});
