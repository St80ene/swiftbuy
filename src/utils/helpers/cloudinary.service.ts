// src/shared/cloudinary.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class CloudinaryService {
  constructor() {
    // Initialize Cloudinary with your environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folderName: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }

    return new Promise((resolve, reject) => {
      // Use upload_stream to push the memory buffer directly to the cloud
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName, // Organizes your assets (e.g., 'products')
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        },
        (error, result: UploadApiResponse) => {
          if (error) return reject(error);
          resolve(result.secure_url); // Returns the permanent secure HTTPS string link
        },
      );

      // Write the file buffer to the stream
      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    try {
      // Extract the public ID from the Cloudinary URL
      // Example: https://res.cloudinary.com/cloud/image/upload/v12345/products/abc.jpg -> products/abc
      const URLParts = imageUrl.split('/');
      const folderAndFileName = URLParts.slice(-2).join('/').split('.')[0];

      await cloudinary.uploader.destroy(folderAndFileName);
    } catch (error) {
      console.error('Failed to delete old image from Cloudinary:', error);
      // We don't throw the error here so that a failed image deletion
      // doesn't crash the entire product database update process.
    }
  }
}
