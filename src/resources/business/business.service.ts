import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import {
  CloudinaryImage,
  CloudinaryService,
} from '../../utils/helpers/cloudinary/cloudinary.service';

@Injectable()
export class BusinessesService {
  private readonly logger = new Logger(BusinessesService.name);
  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createBusinessDto: CreateBusinessDto,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<Business>> {
    const { email, name } = createBusinessDto; // Destructure to ensure all required fields are present

    const exists = await this.businessRepository.findOne({
      where: { name, email },
    });

    if (exists) {
      throw new ConflictException(
        `Workspace name '${name}' or email '${email}' is taken.`,
      );
    }

    try {
      let businessLogo: CloudinaryImage | null = null;

      // Upload to flat single-tenant branding asset namespace
      if (file) {
        const uploadedAsset = await this.cloudinaryService.uploadProductImage(
          file,
          'branding',
        );
        businessLogo = {
          url: uploadedAsset.url,
          publicId: uploadedAsset.publicId,
        };
      }

      const business = this.businessRepository.create({
        name: createBusinessDto.name,
        email: createBusinessDto.email,
        phone_number: createBusinessDto.phone_number,
        currency: createBusinessDto.currency,
        settings: { ...createBusinessDto.settings },
        logo: businessLogo,
      });

      const saved = await this.businessRepository.save(business);
      return successResponse('Business registered successfully', saved);
    } catch (error) {
      console.error('Error creating business profile:', error);
      throw new InternalServerErrorException('Failed to register business.');
    }
  }

  /**
   * ─── FIND ONE PROFILE ───
   */
  async findOne(id: string): Promise<ApiResponse<Business>> {
    const business = await this.businessRepository.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Business profile not found.');
    return successResponse('Business profile retrieved', business);
  }

  /**
   * ─── UPDATE PROFILE & OVERWRITE LOGO ───
   */
  async update(
    id: string,
    updateBusinessDto: UpdateBusinessDto,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<Business>> {
    const business = await this.businessRepository.findOne({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException('Business not found.');
    }

    // No file uploaded
    if (!file) {
      const updatedBusiness = this.businessRepository.merge(
        this.businessRepository.create(business),
        updateBusinessDto,
      );

      const savedBusiness = await this.businessRepository.save(updatedBusiness);

      return successResponse(
        'Business profile updated successfully',
        savedBusiness,
      );
    }

    const oldLogoPublicId = business.logo?.publicId;
    let uploadedAsset: { url: string; publicId: string } | null = null;

    /**
     * STEP 1
     * Upload new logo first.
     */
    try {
      const asset = await this.cloudinaryService.uploadProductImage(
        file,
        'branding',
      );

      uploadedAsset = {
        url: asset.url,
        publicId: asset.publicId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload new business logo: ${(error as Error).message}`,
      );

      throw new BadRequestException('Failed to upload business logo.');
    }

    /**
     * STEP 2
     * Save DB changes
     */
    try {
      const updatedBusiness = this.businessRepository.create(business);

      this.businessRepository.merge(updatedBusiness, updateBusinessDto);

      updatedBusiness['logo'] = uploadedAsset;

      const savedBusiness = await this.businessRepository.save(updatedBusiness);

      /**
       * STEP 3
       * Delete old image AFTER successful DB save.
       */
      if (oldLogoPublicId) {
        try {
          await this.cloudinaryService.deleteImage(oldLogoPublicId);
        } catch (error) {
          this.logger.warn(
            `Failed to delete previous logo (${oldLogoPublicId}): ${
              (error as Error).message
            }`,
          );
        }
      }

      return successResponse(
        'Business profile updated successfully',
        savedBusiness,
      );
    } catch (error) {
      this.logger.error(
        `Error saving business profile changes: ${(error as Error).message}`,
      );

      /**
       * Rollback
       * Delete newly uploaded image.
       */
      if (uploadedAsset) {
        const deleted = await this.cloudinaryService.deleteImage(
          uploadedAsset.publicId,
        );

        if (!deleted) {
          this.logger.warn(
            `Failed to rollback uploaded logo (${uploadedAsset.publicId}).`,
          );
        }
      }

      throw new InternalServerErrorException('Failed to update business logo.');
    }
  }

  /**
   * ─── PURGE PROFILE & BRANDING ASSETS ───
   */
  async remove(id: string): Promise<ApiResponse<null>> {
    const business = await this.businessRepository.findOne({ where: { id } });
    if (!business) throw new NotFoundException('Company not found.');

    try {
      // Clear branding files immediately so storage remain completely lean
      if (business?.logo?.publicId) {
        await this.cloudinaryService.deleteImage(business.logo.publicId);
      }

      await this.businessRepository.softDelete({ id: business.id });
      return successResponse('Business configuration completely purged', null);
    } catch (error) {
      console.error(
        `Error deleting business ${business.name}'s profile:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to delete business profile.',
      );
    }
  }
}
