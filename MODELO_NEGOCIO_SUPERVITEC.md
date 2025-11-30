# MODELO DE NEGOCIO – SUPERVITEC PRO (VERSIÓN OFICIAL)

Optimizado para tu plataforma SaaS multiproyecto.

---

## 🟥 1. ADMIN – Rol Máximo (Superusuario)

Acceso TOTAL al sistema. Se comporta como “dueño del sistema”.

### ✔ Puede:
- Crear / editar / eliminar usuarios de cualquier rol  
- Definir cuántas obras puede crear un Director  
- Definir cuántos usuarios puede crear cada Director  
  - Por defecto → 3 usuarios  
  - Admin puede dejarlo en 1, 2, 5, 10, ilimitado
- Ver todas las obras de todos los directores  
- Crear obras, bitácoras, OT, contratistas, variables, unidades, mediciones, etc.
- Eliminar cualquier registro del sistema

### ❗ Admin tiene control absoluto
No tiene restricciones.

---

## 🟨 2. DIRECTOR – (Rol asociado al plan $90)

Este es el cliente principal del SaaS.

### ✔ Puede:
- Crear sus usuarios internos (supervisor, residente o visitante)  
  - Máximo inicial: 3 usuarios (Admin puede aumentar este valor)
- Crear obras  
  - Valor inicial → 1 obra  
  - Admin puede aumentar el número (0, 1, 2, 5, ilimitado)
- Crear:
  - Bitácoras
  - Órdenes de Trabajo (OT)
  - Contratistas

### Ver únicamente:
- Sus propias obras
- Bitácoras y OT de sus obras
- Sus propios contratistas

### ❌ No puede:
- Crear variables
- Crear unidades
- Crear mediciones
- Crear usuarios de rol diferente a Supervisor / Residente / Visitante
- Eliminar usuarios creados por Admin
- Ver obras de otros directores

> ⚠ Este rol es una mini-empresa dentro de tu SaaS.  
> Todo lo que cree debe vincularse a `directorId`.

---

## 🟦 3. SUPERVISOR – Rol operativo técnico

Depende de un Director o Admin.

### ✔ Puede:
- Crear bitácoras
- Crear órdenes de trabajo
- Editar sus bitácoras y OT
- Ver solo su(s) obra(s) asignada(s)
- Crear contratistas

### ❌ No puede:
- Crear obras
- Crear variables
- Crear unidades
- Crear mediciones
- Crear usuarios

Supervisor es operario técnico de campo: entra a registrar información, evidencias, OT y bitácoras.

---

## 🟩 4. RESIDENTE – Rol operativo limitado

### ✔ Puede:
- Crear bitácoras
- Crear órdenes de trabajo
- Ver solo obra asignada
- Subir fotos/evidencias

### ❌ No puede:
- Crear usuarios
- Crear obras
- Crear contratistas
- Crear variables / unidades / mediciones

Residente es más limitado que supervisor.

---

## 🟫 5. VISITANTE – Solo Lectura

### ✔ Puede:
- Ver bitácoras
- Ver OT
- Ver fotos
- Descargar PDF

### ❌ No puede:
- Crear / editar / eliminar nada
- Crear usuarios
- Crear obras
- Crear contratistas, variables, etc.

Este rol es típico para clientes, interventores o auditores.

---

## 📦 6. MATRIZ DE PERMISOS OFICIAL

| Rol       | Crear Usuarios           | Crear Obras        | Crear Bitácoras | Crear OT | Crear Contratistas | Crear Variables | Crear Unidades | Crear Mediciones | Acceso |
|-----------|--------------------------|--------------------|-----------------|----------|--------------------|-----------------|----------------|------------------|--------|
| ADMIN     | ✔ ilimitado              | ✔ ilimitado        | ✔               | ✔        | ✔                  | ✔               | ✔              | ✔                | ✔ Todo |
| DIRECTOR  | ✔ (máx inicial 3)        | ✔ (máx inicial 1)  | ✔               | ✔        | ✔                  | ✖               | ✖              | ✖                | Solo lo suyo |
| SUPERVISOR| ✖                        | ✖                  | ✔               | ✔        | ✔                  | ✖               | ✖              | ✖                | Solo obras asignadas |
| RESIDENTE | ✖                        | ✖                  | ✔               | ✔        | ✖                  | ✖               | ✖              | ✖                | Solo obra asignada |
| VISITANTE | ✖                        | ✖                  | ✖               | ✖        | ✖                  | ✖               | ✖              | ✖                | Solo lectura |

---

## 🧩 7. Lógica técnica detrás del negocio

- Todo lo creado por un DIRECTOR y sus usuarios se vincula por `directorId`.
- Los permisos y límites (usuarios, obras) son configurables por el ADMIN.
- Los roles operativos (Supervisor, Residente, Visitante) trabajan **solo sobre las obras asignadas**.
