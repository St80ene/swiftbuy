import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from './entities/user.entity';
import { ChangeUserRoleDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../common/enum/user_role.enum';

import {
  ApiResponse,
  successResponse,
} from '../../common/utils/response.utils';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import {
  CloudinaryImage,
  CloudinaryService,
} from '../../common/utils/helpers/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,

    private readonly cloudinaryService: CloudinaryService,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Create a new user.
   */
  async create(
    createUserDto: CreateUserDto,
    currentUser: AuthenticatedUser,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<User | null>> {
    /**
     * Validate/read-only operations can happen before the transaction.
     */
    const existingUser = await this.userRepository.findOne({
      where: {
        company_email: createUserDto.company_email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered.');
    }

    const role = await this.findUserRole(createUserDto.role_id);

    /**
     * Only a Super Admin can create another Super Admin.
     */
    if (
      role.name === UserRole.SUPER_ADMIN &&
      currentUser?.role.name !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You are not authorized to create a Super Admin.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    let profileImage: CloudinaryImage | null = null;

    try {
      /**
       * Upload profile image to Cloudinary.
       *
       * Cloudinary is external to the database transaction,
       * so it is manually cleaned up if the transaction fails.
       */
      if (file) {
        profileImage = await this.cloudinaryService.uploadImage(file, 'users');
      }

      /**
       * Explicit property mapping.
       *
       * Avoid spreading createUserDto directly into the entity
       * to prevent unintended properties from being persisted.
       */
      const user = queryRunner.manager.create(User, {
        first_name: createUserDto.first_name,
        last_name: createUserDto.last_name,
        company_email: createUserDto.company_email,
        phone_number: createUserDto.phone_number,
        role_id: role.id,
        is_active: true,
        ...(profileImage && {
          profile_image: profileImage,
        }),
      });

      await queryRunner.manager.save(User, user);

      await queryRunner.commitTransaction();

      return successResponse('User added successfully', null);
    } catch (error) {
      /**
       * Roll back any database changes.
       */
      await queryRunner.rollbackTransaction();

      /**
       * Database transactions cannot roll back Cloudinary uploads,
       * so remove the uploaded asset manually.
       */
      if (profileImage) {
        await this.cloudinaryService
          .deleteImage(profileImage.publicId)
          .catch(() => null);
      }

      /**
       * Preserve NestJS exceptions such as:
       * ConflictException
       * ForbiddenException
       * NotFoundException
       * BadRequestException
       * etc.
       */
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get paginated users.
   */
  async findAll({ page, limit }: { page?: number; limit?: number }): Promise<
    ApiResponse<{
      users: User[];
      meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    }>
  > {
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.max(1, Number(limit) || 10);

    const skip = (pageNumber - 1) * limitNumber;

    const [users, totalItems] = await this.userRepository.findAndCount({
      take: limitNumber,
      skip,
      order: {
        created_at: 'DESC',
      },
    });

    const totalPages = Math.ceil(totalItems / limitNumber);

    return successResponse('Users listed successfully', {
      users,
      meta: {
        totalItems,
        itemCount: users.length,
        itemsPerPage: limitNumber,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: pageNumber < totalPages,
        hasPreviousPage: pageNumber > 1,
      },
    });
  }

  /**
   * Update user profile.
   *
   * Role and activation state are handled through their
   * dedicated endpoints.
   */
  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: AuthenticatedUser,
    file?: Express.Multer.File,
  ): Promise<ApiResponse<User>> {
    if (currentUser.id !== id) {
      throw new ForbiddenException(
        'You are not authorized to update this user.',
      );
    }

    const { data: user } = await this.findOne(id);

    if (!user) {
      throw new NotFoundException('User record not found.');
    }

    if (dto.company_email && dto.company_email !== user.company_email) {
      const existingUser = await this.userRepository.findOne({
        where: {
          company_email: dto.company_email,
        },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already registered.');
      }

      user.company_email = dto.company_email;
    }

    /**
     * Keep a reference to the existing image.
     *
     * We only delete it from Cloudinary after the database
     * update has successfully completed.
     */
    const previousProfileImage = user.profile_picture ?? null;

    let newProfileImage: CloudinaryImage | null = null;

    try {
      /**
       * Upload the new profile image if one was provided.
       */
      if (file) {
        newProfileImage = await this.cloudinaryService.uploadImage(
          file,
          'users',
        );

        user.profile_picture = newProfileImage;
      }

      /**
       * Explicit property mapping.
       *
       */
      this.userRepository.merge(user, {
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone_number: dto.phone_number,
        company_email: user.company_email,
      });

      const updatedUser = await this.userRepository.save(user);

      /**
       * Only delete the old Cloudinary image after the DB
       * update has succeeded.
       */
      if (newProfileImage && previousProfileImage) {
        await this.cloudinaryService
          .deleteImage(previousProfileImage.publicId)
          .catch(() => null);
      }

      return successResponse('User updated successfully', updatedUser);
    } catch (error) {
      /**
       * The database update failed after uploading the new image.
       * Remove the newly uploaded Cloudinary asset to prevent
       * orphaned files.
       */
      if (newProfileImage) {
        await this.cloudinaryService
          .deleteImage(newProfileImage.publicId)
          .catch(() => null);
      }

      throw error;
    }
  }

  /**
   * Deactivate a user.
   *
   * This does not delete the database record.
   */
  async deactivate(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<ApiResponse<null>> {
    const { data: user } = await this.findOne(id);

    if (!user) throw new NotFoundException('User record not found.');

    if (user.id === currentUser.id) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    if (user.role?.name === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('A Super Admin cannot be deactivated.');
    }

    if (!user.is_active) {
      throw new ConflictException('User account is already deactivated.');
    }

    user.is_active = false;

    await this.userRepository.save(user);

    return successResponse('User deactivated successfully', null);
  }

  /**
   * Activate a user.
   */
  async activate(
    id: string,
    currentUser: AuthenticatedUser,
  ): Promise<ApiResponse<User>> {
    const { data: user } = await this.findOne(id);

    if (
      currentUser?.role.name !== UserRole.SUPER_ADMIN &&
      currentUser?.role.name !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You are not authorized to activate users.');
    }

    if (!user) throw new NotFoundException('User record not found.');

    if (user.id === currentUser.id) {
      throw new ForbiddenException('You cannot activate your own account.');
    }

    if (user.is_active) {
      throw new ConflictException('User account is already active.');
    }

    user.is_active = true;

    const updatedUser = await this.userRepository.save(user);

    return successResponse('User activated successfully', updatedUser);
  }

  /**
   * Change a user's role.
   */
  async changeRole(
    id: string,
    dto: ChangeUserRoleDto,
    currentUser: AuthenticatedUser,
  ): Promise<ApiResponse<User>> {
    const { data: user_to_be_updated } = await this.findOne(id);

    if (id === currentUser.id) {
      throw new ForbiddenException('You cannot change your own role.');
    }

    if (!user_to_be_updated)
      throw new NotFoundException('User record not found.');

    if (user_to_be_updated.role?.name === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('A Super Admin role cannot be changed.');
    }

    const new_role = await this.findUserRole(dto.role_id);

    if (new_role.id === user_to_be_updated.role_id) {
      throw new ConflictException('The user already has the specified role.');
    }

    user_to_be_updated.role_id = new_role.id;

    const updatedUser = await this.userRepository.save(user_to_be_updated);

    return successResponse('User role updated successfully', updatedUser);
  }

  /**
   * Find a user by ID.
   */
  async findOne(id: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
      relations: {
        role: true,
        business: true,
        store: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User record not found.');
    }

    return successResponse('User retrieved successfully', user);
  }

  /**
   * Find a role by ID.
   */
  private async findUserRole(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: {
        id,
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    return role;
  }
}
