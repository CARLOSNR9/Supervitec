// Archivo: backend/prisma/test-obras-seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Limpiando SOLO la tabla Obra para test...');
    // Limpiar solo la tabla Obra antes de insertar, sin afectar a los usuarios.
    await prisma.obra.deleteMany(); 

    // -----------------------------------------------------------
    // IDs de usuarios asumidos (basados en el seed.ts anterior)
    // Estos IDs DEBEN existir en tu tabla User para que las relaciones funcionen.
    // -----------------------------------------------------------
    const ADMIN_ID = 101;
    const DIRECTOR_ID = 102;
    const SUPERVISOR_ID = 103;
    const RESIDENTE1_ID = 104;
    const RESIDENTE2_ID = 105;

    // -----------------------------------------------------------
    // OBRAS DE PRUEBA (10 Registros)
    // -----------------------------------------------------------

    const obrasToCreate = [
        // Creador: ADMIN (101). Responsables: 101, 102, 104
        { prefijo: 'AD24', nombre: 'Desarrollo Urbano Central', creatorId: ADMIN_ID, responsables: [ADMIN_ID, DIRECTOR_ID, RESIDENTE1_ID], estado: 'EN_PROGRESO', observaciones: 'Fase de permisos y diseño estructural avanzado.' },
        
        // Creador: DIRECTOR (102). Responsables: 102, 103
        { prefijo: 'PDT1', nombre: 'Parque Industrial Tecnológico', creatorId: DIRECTOR_ID, responsables: [DIRECTOR_ID, SUPERVISOR_ID], estado: 'PENDIENTE', observaciones: 'Pendiente aprobación final de inversión.' },
        
        // Creador: RESIDENTE1 (104). Responsables: 104
        { prefijo: 'CR45', nombre: 'Conjunto Residencial Los Robles', creatorId: RESIDENTE1_ID, responsables: [RESIDENTE1_ID], estado: 'EN_PROGRESO', observaciones: 'Fundación del segundo nivel y trazado de ejes.' },
        
        // Creador: RESIDENTE2 (105). Responsables: 105, 104
        { prefijo: 'VT25', nombre: 'Viviendas del Sol - Etapa 2', creatorId: RESIDENTE2_ID, responsables: [RESIDENTE2_ID, RESIDENTE1_ID], estado: 'PENDIENTE', observaciones: 'Revisión preliminar de terreno.' },

        // Creador: ADMIN (101). Responsables: 102
        { prefijo: 'MRL3', nombre: 'Reserva de la Leonora', creatorId: ADMIN_ID, responsables: [DIRECTOR_ID], estado: 'FINALIZADA', observaciones: 'Entrega y cierre técnico completado.' },

        // Creador: SUPERVISOR1 (103). Responsables: 103
        { prefijo: 'BPC9', nombre: 'Portal de Cerezos', creatorId: SUPERVISOR_ID, responsables: [SUPERVISOR_ID], estado: 'EN_PROGRESO', observaciones: 'Supervisión de acabados en obra.' },

        // Creador: DIRECTOR (102). Responsables: 105, 103
        { prefijo: 'BBE6', nombre: 'Entre Bosques - Fase 3', creatorId: DIRECTOR_ID, responsables: [RESIDENTE2_ID, SUPERVISOR_ID], estado: 'PENDIENTE', observaciones: 'Pendiente entrega de materiales y planos.' },

        // Creador: ADMIN (101). Responsables: 101
        { prefijo: 'AAS1', nombre: 'Almendros de Bella Suiza', creatorId: ADMIN_ID, responsables: [ADMIN_ID], estado: 'FINALIZADA', observaciones: 'Proyecto entregado y liquidado.' },

        // Creador: RESIDENTE1 (104). Responsables: 104, 102
        { prefijo: 'LP50', nombre: 'Loteo Parque Lineal', creatorId: RESIDENTE1_ID, responsables: [RESIDENTE1_ID, DIRECTOR_ID], estado: 'EN_PROGRESO', observaciones: 'Avance del 50% en vías de acceso.' },
        
        // Creador: ADMIN (101). Responsables: 104
        { prefijo: 'OEX0', nombre: 'Obra Ejemplo Cero Final', creatorId: ADMIN_ID, responsables: [RESIDENTE1_ID], estado: 'PENDIENTE', observaciones: 'Observación de prueba final.' },
    ];

    for (const o of obrasToCreate) {
        await prisma.obra.create({
            data: {
                prefijo: o.prefijo,
                nombre: o.nombre,
                estado: o.estado as any, 
                observaciones: o.observaciones,
                // Conectar al creador
                creator: { connect: { id: o.creatorId } },
                // Conectar a los responsables
                responsables: { 
                    connect: o.responsables.map(rId => ({ id: rId }))
                }
            },
        });
    }

    console.log('✅ 10 Obras de prueba insertadas con éxito.');
}

main()
    .catch((e) => {
        console.error('❌ Error al ejecutar el seed de obras:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });