// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { ApiResponse, successResponse } from '../../utils/response.utils';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * ─── CREATE USER ───
   */
  async create(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    // Check unique constraint directly on email for the entire system

    try {
      const exists = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (exists) {
        throw new ConflictException('Email already registered.');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role as UserRole, // Default role if not provided
      });

      const saved = await this.userRepository.save(user);
      delete (saved as any).password;

      return successResponse(
        'User added successfully',
        Array.isArray(saved) ? saved[0] : saved,
      );
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user record.');
    }
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
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User record not found.');

    this.userRepository.merge(user, {
      ...updateUserDto,
      role: updateUserDto.role as UserRole,
    });
    const updated = await this.userRepository.save(user);

    return successResponse('User updated successfully', updated);
  }

  /**
   * ─── REMOVE USER ───
   */
  async remove(id: string): Promise<ApiResponse<null>> {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException('User record not found.');

      await this.userRepository.softRemove(user);
      return successResponse('User deleted successfully', null);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new InternalServerErrorException('Failed to delete user.');
    }
  }
}
