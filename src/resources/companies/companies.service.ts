// src/companies/companies.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
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
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createCompanyDto: CreateCompanyDto,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<Company>> {
    const exists = await this.companyRepository.findOne({
      where: { name: createCompanyDto.name },
    });
    if (exists) {
      throw new ConflictException(
        `Workspace name '${createCompanyDto.name}' is taken.`,
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
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found.');

    try {
      if (file) {
        // Wipe existing brand asset from host memory to avoid trailing orphaned assets
        if (company.logo?.publicId) {
          await this.cloudinaryService.deleteImage(company.logo.publicId);
        }

        const newAsset = await this.cloudinaryService.uploadProductImage(
          file,
          'branding',
        );
        company.logo = {
          url: newAsset.url,
          publicId: newAsset.publicId,
        };
      }

      this.companyRepository.merge(company, updateCompanyDto);
      const updated = await this.companyRepository.save(company);
      return successResponse('Company profile updated', updated);
    } catch (error) {
      console.error(`Error updating company profile ${id}:`, error);
      throw new InternalServerErrorException(
        'Failed to update company profile.',
      );
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

      await this.companyRepository.softRemove(company);
      return successResponse('Company configuration completely purged', null);
    } catch (error) {
      console.error(`Error deleting company profile ${id}:`, error);
      throw new InternalServerErrorException('Failed to delete company.');
    }
  }
}
