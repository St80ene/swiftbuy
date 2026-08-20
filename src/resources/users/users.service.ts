import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { ChangeUserRoleDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse, successResponse } from '../../utils/response.utils';
import { Role } from '../../auth/entities/role.entity';
import { UserRole } from '../../enum/user_role.enum';

export interface JwtUser {
  id: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * ─── CREATE USER ───
   */

  /**
   * @param createUserDto - Data Transfer Object containing user creation details
   * @param currentUser - The currently authenticated user making the request
   * @returns ApiResponse containing the created User or null
   * @throws ConflictException if the email is already registered
   * @throws ForbiddenException if a non-SUPER_ADMIN tries to create a SUPER_ADMIN
   * @throws InternalServerErrorException if there is an error during user creation
   * @remarks This method checks for existing users, validates roles, and saves the new user to the database. It ensures that only authorized users can create certain roles.
   * @example
   * const createUserDto: CreateUserDto = {
   *   first_name: 'John',
   *   last_name: 'Doe',
   *   email: 'example@example.com',
   *   role_id: 'role-id'
   * };
   */
  async create(
    createUserDto: CreateUserDto,
    currentUser: JwtUser,
  ): Promise<ApiResponse<User | null>> {
    // Check if the email already exists in the database
    const exists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (exists) {
      throw new ConflictException('Email already registered.');
    }

    const desired_role = await this.findUserRole(createUserDto.role_id);

    // Only SUPER_ADMIN can create another SUPER_ADMIN
    if (
      desired_role.name === UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You are not authorized to create a Super Admin.',
      );
    }

    const user = this.userRepository.create({
      ...createUserDto,
      role_id: createUserDto.role_id,
    });

    // await this.userAuthRepository.save({
    //   user_id: user.id, // Associate the UserAuth with the newly created User
    //   password: hashedPassword,
    // });

    await this.userRepository.save(user);

    return successResponse('User added successfully', null);
  }

  /**
   * ─── FIND ALL ───
   */
  async findAll({
    page,
    limit,
  }: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ users: User[]; meta: any }>> {
    try {
      const pageNumber = Math.max(1, Number(page) || 1);
      const limitNumber = Math.max(1, Number(limit) || 10);
      const skip = (pageNumber - 1) * limitNumber;

      console.log('gotten here first');
      const [users, totalItems] = await this.userRepository.findAndCount({
        take: limitNumber,
        skip: skip,
        order: { createdAt: 'DESC' },
      });

      console.log('gotten here');

      return successResponse('Users listed successfully', {
        users,
        meta: {
          totalItems,
          itemCount: users.length,
          itemsPerPage: limitNumber,
          totalPages: Math.ceil(totalItems / limitNumber),
          currentPage: pageNumber,
          hasNextPage: pageNumber < Math.ceil(totalItems / limitNumber),
          hasPreviousPage: pageNumber > 1,
        },
      });
    } catch (error) {
      console.log('Error fetching users:', error);

      throw new InternalServerErrorException('Failed to fetch users.');
    }
  }

  /**
   * ─── UPDATE USER ───
   */
  async update(id: string, dto: UpdateUserDto, currentUser: JwtUser) {
    const user = await this.findUser(id);

    if (currentUser.id !== id) {
      throw new ForbiddenException();
    }

    // Only Super Admin can change roles
    // if (dto.role_id && currentUser.role !== UserRole.SUPER_ADMIN) {
    //   throw new ForbiddenException('Only Super Admin can change user roles.');
    // }

    this.userRepository.merge(user, dto);

    const updated = await this.userRepository.save(user);

    return successResponse('User updated successfully', updated);
  }

  private async findUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException('User record not found');
    }

    return user;
  }

  /**
   * ─── REMOVE USER ───
   */
  async remove(id: string, currentUser: JwtUser) {
    const user = await this.findUser(id);

    if (user.id === currentUser.id) {
      throw new ForbiddenException('You cannot delete your own account.');
    }

    if (user.role?.name === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('A Super Admin cannot be deleted.');
    }

    await this.userRepository.softRemove(user);

    return successResponse('User deleted successfully', null);
  }

  async changeRole(id: string, dto: ChangeUserRoleDto, currentUser: JwtUser) {
    const user = await this.findUser(id);

    const newRole = await this.findUserRole(dto.role_id);

    /**
     * Prevent accidental removal of the last
     * Super Admin.
     */
    if (
      user.role?.name === UserRole.SUPER_ADMIN &&
      newRole.name !== UserRole.SUPER_ADMIN
    ) {
      const superAdminCount = await this.userRepository.count({
        where: {
          role_id: user.role_id,
        },
      });

      if (superAdminCount <= 1) {
        throw new ForbiddenException('The last Super Admin cannot be demoted.');
      }
    }

    user.role_id = newRole.id;

    await this.userRepository.save(user);

    return successResponse('User role updated successfully', user);
  }

  private async findUserRole(id: string): Promise<Role> {
    // call role service to fetch the required role from database
    const desired_role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!desired_role) {
      throw new NotFoundException('Role not found.');
    }

    return desired_role;
  }
}
