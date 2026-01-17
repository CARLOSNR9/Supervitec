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
    const url = (process.env.CLOUDINARY_URL || '').trim();
    if (!url) {
      throw new Error('Missing CLOUDINARY_URL in environment');
    }

    // Cloudinary leerá credenciales desde CLOUDINARY_URL
    cloudinary.config({ secure: true });

    this.logger.log('✅ Cloudinary configured via CLOUDINARY_URL');
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
  });
}

  async deleteImage(publicId: string): Promise < any > {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}
}
