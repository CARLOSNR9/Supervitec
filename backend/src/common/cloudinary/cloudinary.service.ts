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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Si tienes las 3 vars, configuramos explícito (recomendado)
    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    } else if (process.env.CLOUDINARY_URL) {
      // fallback: si usas CLOUDINARY_URL, Cloudinary lo toma desde env
      cloudinary.config({ secure: true });
    }

    this.logger.log(
      `Cloudinary env -> cloud_name=${cloudName ? 'set' : 'missing'} api_key=${apiKey ? 'set' : 'missing'} api_secret=${apiSecret ? 'set' : 'missing'} CLOUDINARY_URL=${process.env.CLOUDINARY_URL ? 'set' : 'missing'}`,
    );
  }

  async uploadImage(file: Express.Multer.File): Promise<any> {
    if (!file?.buffer || file.buffer.length === 0) {
      throw new InternalServerErrorException(
        `Empty file buffer for ${file?.originalname ?? 'unknown'}`,
      );
    }

    const cfg = (cloudinary as any).config?.();
    if (!cfg?.cloud_name || !cfg?.api_key || !cfg?.api_secret) {
      throw new InternalServerErrorException(
        'Cloudinary credentials not configured on server (missing cloud_name/api_key/api_secret).',
      );
    }

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'supervitec-bitacoras',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      toStream.createReadStream(file.buffer).pipe(upload);
    });
  }
}
