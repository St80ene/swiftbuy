// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ApiResponse, successResponse } from '../../utils/response.utils';

export interface JwtUser {
  id: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * ─── CREATE USER ───
   */
  async create(
    createUserDto: CreateUserDto,
    currentUser: JwtUser,
  ): Promise<ApiResponse<User>> {
    const exists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered.');
    }

    // Only SUPER_ADMIN can create another SUPER_ADMIN
    if (
      createUserDto.role === UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You are not authorized to create a Super Admin.',
      );
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const saved = await this.userRepository.save(user);

    delete saved.password;

    return successResponse('User added successfully', saved);
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

      const [users, totalItems] = await this.userRepository.findAndCount({
        take: limitNumber,
        skip: skip,
        order: { createdAt: 'DESC' },
      });

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
      console.error('Error fetching users:', error);
      throw new InternalServerErrorException('Failed to fetch users.');
    }
  }

  /**
   * ─── UPDATE USER ───
   */
  async update(id: string, dto: UpdateUserDto, currentUser: JwtUser) {
    const user = await this.findUser(id);

    // Normal users can only update themselves
    if (currentUser.role === UserRole.USER && currentUser.id !== id) {
      throw new ForbiddenException();
    }

    // Only Super Admin can change roles
    if (dto.role && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can change user roles.');
    }

    this.userRepository.merge(user, dto);

    const updated = await this.userRepository.save(user);

    return successResponse('User updated successfully', updated);
  }

  private async findUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User record not found.');
    }

    return user;
  }

  /**
   * ─── REMOVE USER ───
   */
  async remove(id: string, currentUser: JwtUser) {
    const user = await this.findUser(id);

    // Users cannot delete anyone
    if (currentUser.role === UserRole.USER) {
      throw new ForbiddenException();
    }

    // Admin cannot delete another admin
    if (currentUser.role === UserRole.ADMIN && user.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admins cannot delete other admins.');
    }

    // Nobody except Super Admin can delete Super Admin
    if (
      user.role === UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException();
    }

    await this.userRepository.softRemove(user);

    return successResponse('User deleted successfully', null);
  }
}
