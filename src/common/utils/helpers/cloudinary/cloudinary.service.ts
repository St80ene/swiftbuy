import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as path from 'path';

interface CloudinaryDestroyResponse {
  result: 'ok' | 'not_found' | (string & {});
}

export interface CloudinaryImage {
  url: string;
  publicId: string;
}

@Injectable()
export class CloudinaryService {
  async uploadProductImage(
    file: Express.Multer.File,
    folderName: string = 'products',
  ): Promise<CloudinaryImage> {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    const sanitizedFolder = folderName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');

    const originalNameWithoutExt = path.parse(file.originalname).name;
    const sanitizedFileName = originalNameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;

    const targetFolderPath = `${sanitizedFolder}`;
    const customPublicId = `${sanitizedFileName}-${uniqueSuffix}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolderPath,
          public_id: customPublicId,
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          use_filename: true,
          unique_filename: false,
        },
        (error, result) => {
          const apiResponse = result;
          if (error)
            return reject(
              new Error(`Cloudinary upload error: ${error.message}`),
            );
          if (!apiResponse)
            return reject(new Error('Cloudinary response empty.'));

          resolve({
            url: apiResponse.secure_url,
            publicId: apiResponse.public_id,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      // 2. Await the response and explicitly cast it from 'any' to our strict interface
      const response = (await cloudinary.uploader.destroy(
        publicId,
      )) as CloudinaryDestroyResponse;

      // 3. Now this is fully safe, and ESLint will not complain!
      return response.result === 'ok';
    } catch {
      return false;
    }
  }
}
