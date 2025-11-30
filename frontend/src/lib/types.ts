// src/lib/types.ts
export type JwtLoginResponse = { access_token: string };

export type Bitacora = {
  id: number;
  obra: { id: number; nombre: string };
  responsable: { id: number; username: string };
  variable: string;
  estado: string;
  createdAt: string;
  ubicacion?: string | null;
  observaciones?: string | null;
};

export type OrdenTrabajo = {
  id: number;
  obra: { id: number; nombre: string };
  responsable: { id: number; username: string };
  tipoTrabajo: string;
  identificacion: string;
  estado: string;
  fecha: string;
};
