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
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import {
  CloudinaryImage,
  CloudinaryService,
} from '../../utils/helpers/cloudinary/cloudinary.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<Company>> {
    const { email, name } = createCompanyDto; // Destructure to ensure all required fields are present

    const exists = await this.companyRepository.findOne({
      where: { name, email },
    });

    if (exists) {
      throw new ConflictException(
        `Workspace name '${name}' or email '${email}' is taken.`,
      );
    }

    try {
      let companyLogo: CloudinaryImage | null = null;

      // Upload to flat single-tenant branding asset namespace
      if (file) {
        const uploadedAsset = await this.cloudinaryService.uploadProductImage(
          file,
          'branding',
        );
        companyLogo = {
          url: uploadedAsset.url,
          publicId: uploadedAsset.publicId,
        };
      }

      const company = this.companyRepository.create({
        name: createCompanyDto.name,
        email: createCompanyDto.email,
        phone_number: createCompanyDto.phone_number,
        currency: createCompanyDto.currency,
        settings: { ...createCompanyDto.settings },
        logo: companyLogo,
      });

      const saved = await this.companyRepository.save(company);
      return successResponse('Company registered successfully', saved);
    } catch (error) {
      console.error('Error creating company profile:', error);
      throw new InternalServerErrorException('Failed to register company.');
    }
  }

  /**
   * ─── FIND ONE PROFILE ───
   */
  async findOne(id: string): Promise<ApiResponse<Company>> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company profile not found.');
    return successResponse('Company profile retrieved', company);
  }

  /**
   * ─── UPDATE PROFILE & OVERWRITE LOGO ───
   */
  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<Company>> {
    const company = await this.companyRepository.findOne({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found.');
    }

    // No file uploaded
    if (!file) {
      const updatedCompany = this.companyRepository.merge(
        this.companyRepository.create(company),
        updateCompanyDto,
      );

      const savedCompany = await this.companyRepository.save(updatedCompany);

      return successResponse(
        'Company profile updated successfully',
        savedCompany,
      );
    }

    const oldLogoPublicId = company.logo?.publicId;
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
        `Failed to upload new logo: ${(error as Error).message}`,
      );

      throw new BadRequestException('Failed to upload company logo.');
    }

    /**
     * STEP 2
     * Save DB changes
     */
    try {
      const updatedCompany = this.companyRepository.create(company);

      this.companyRepository.merge(updatedCompany, updateCompanyDto);

      updatedCompany['logo'] = uploadedAsset;

      const savedCompany = await this.companyRepository.save(updatedCompany);

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
        'Company profile updated successfully',
        savedCompany,
      );
    } catch (error) {
      this.logger.error(
        `Error saving company profile changes: ${(error as Error).message}`,
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

      throw new InternalServerErrorException('Failed to update company logo.');
    }
  }

  /**
   * ─── PURGE PROFILE & BRANDING ASSETS ───
   */
  async remove(id: string): Promise<ApiResponse<null>> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found.');

    try {
      // Clear branding files immediately so storage remain completely lean
      if (company?.logo?.publicId) {
        await this.cloudinaryService.deleteImage(company.logo.publicId);
      }

      await this.companyRepository.softDelete({ id: company.id });
      return successResponse('Company configuration completely purged', null);
    } catch (error) {
      console.error(`Error deleting company ${company.name}'s profile:`, error);
      throw new InternalServerErrorException('Failed to delete company.');
    }
  }
}
