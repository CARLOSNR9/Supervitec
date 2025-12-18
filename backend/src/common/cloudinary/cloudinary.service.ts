import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('streamifier');

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    // 👇 TRIM para eliminar espacios / saltos de línea de Render
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || '').trim();

    // Log seguro (sin exponer secretos)
    this.logger.log(
      `Cloudinary ENV -> cloud_name=${cloudName ? cloudName : 'missing'} api_key_last4=${
        apiKey ? apiKey.slice(-4) : 'missing'
      } api_secret_len=${apiSecret ? apiSecret.length : 0} CLOUDINARY_URL=${
        process.env.CLOUDINARY_URL ? 'set' : 'missing'
      }`,
    );

    if (!cloudName || !apiKey || !apiSecret) {
      // Importante: si falta algo, que falle claramente.
      throw new Error(
        'Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET',
      );
    }

    // ✅ Forzar config explícita (evita configs “fantasma” por CLOUDINARY_URL)
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<any> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new InternalServerErrorException(
        `Empty file buffer for ${file?.originalname ?? 'unknown'}`,
      );
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'supervitec-bitacoras', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      toStream.createReadStream(file.buffer).pipe(upload);
    });
  }
}
