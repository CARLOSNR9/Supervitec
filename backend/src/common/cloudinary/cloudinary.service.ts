import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import toStream = require('streamifier');

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: 'supervitec-bitacoras' }, // Nombre de la carpeta en Cloudinary
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      toStream.createReadStream(file.buffer).pipe(upload);
    });
  }
}