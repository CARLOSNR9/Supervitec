// 📄 Archivo: src/common/pipes/parse-json.pipe.ts

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseJsonPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    const { type } = metadata;

    // Solo aplica para el body de la petición
    if (type !== 'body') {
      return value;
    }

    // 💡 El frontend envía el JSON serializado en el campo 'data' del FormData
    if (value && typeof value === 'object' && value.data) {
      try {
        // Deserializar el campo 'data' a un objeto
        return JSON.parse(value.data);
      } catch (e) {
        throw new BadRequestException('El campo "data" no contiene un JSON válido.');
      }
    }

    // Si no hay campo 'data', retornar el valor original
    return value;
  }
}
