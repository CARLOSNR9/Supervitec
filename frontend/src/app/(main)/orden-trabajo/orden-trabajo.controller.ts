import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  UseInterceptors, // 🚀 Nuevo
  UploadedFile, // 🚀 Nuevo
  InternalServerErrorException, // Para manejo de errores
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // 🚀 Nuevo
import { diskStorage } from 'multer'; // 🚀 Nuevo
import { OrdenTrabajoService } from './orden-trabajo.service';
import { CreateOrdenTrabajoDto } from './dto/create-orden-trabajo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asegúrate de la ruta correcta
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

// ⚠️ Se necesita el módulo 'fs' (File System) para eliminar archivos si el servicio falla
import * as fs from 'fs'; 

// ⚙️ Configuración para guardar archivos localmente
const storage = diskStorage({
  // La carpeta donde se guardarán los archivos, relativa a la raíz de la aplicación NestJS
  destination: './uploads/actividades', 
  filename: (req, file, cb) => {
    // Generar un nombre único (ej: ID_Actividad-timestamp.ext)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Obtener la extensión del archivo original
    const fileExtension = file.originalname.split('.').pop();
    // Construir el nombre del archivo final
    cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExtension}`);
  },
});

@ApiTags('orden-trabajo')
@Controller('orden-trabajo')
@UseGuards(JwtAuthGuard) // Protegemos la ruta
@ApiBearerAuth()
export class OrdenTrabajoController {
  constructor(private readonly ordenTrabajoService: OrdenTrabajoService) {}
  
  @Post()
  @UseInterceptors(
    // 🚀 Usamos 'foto' como el campo que espera del FormData del cliente (Frontend)
    FileInterceptor('foto', { storage: storage }), 
  )
  async create(
    // Nota: Cuando se usa FormData, el DTO de texto viene como string JSON en Body, 
    // y debe ser parseado en un Interceptor o Pipe si quieres que sea un objeto. 
    // Aquí asumimos que el DTO ya está correctamente parseado (ej. usando un Pipe).
    @Body() createOtDto: CreateOrdenTrabajoDto, 
    @Request() req: any, 
    // 🚀 Captura el archivo Multer inyectado por el FileInterceptor
    @UploadedFile() foto: Express.Multer.File, 
  ) {
    const responsableId = req.user.userId; 
    
    // Validar si la foto es estrictamente obligatoria
    // if (!foto) {
    //   // Si no se carga foto, lanza una excepción de error de cliente
    //   throw new InternalServerErrorException("La Foto 1 es obligatoria para el registro.");
    // }

    console.log('📦 Archivo cargado:', foto);
    console.log('📦 DTO de Orden de Trabajo recibido:', createOtDto);

    try {
      // Pasamos el DTO, el ID del responsable y los metadatos del archivo al servicio
      // El servicio ahora debe manejar la lógica de dónde guardar la ruta de la foto (e.g., ActividadMedia)
      return this.ordenTrabajoService.create(createOtDto, responsableId, foto);
    } catch (e) {
        // En caso de error en el servicio, debemos asegurar el borrado del archivo
        if (foto && foto.path) {
            fs.unlinkSync(foto.path); // Borra el archivo que Multer ya guardó
            console.error(`🗑️ Archivo temporal eliminado: ${foto.path}`);
        }
        // Propaga el error para que NestJS lo maneje
        throw e;
    }
  }

  // ... (otros métodos del controlador) ...
}