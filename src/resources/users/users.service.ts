// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
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
    const exists = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (exists) {
      throw new ConflictException('Email already registered.');
    }

    try {
      const hashedPassword = await bcrypt.hash(
        createUserDto.password || 'Password123!',
        10,
      );

      const user = this.userRepository.create({
        ...createUserDto,
        password: hashedPassword,
      });

      const saved = await this.userRepository.save(user);
      delete (saved as any).password;

      return successResponse('User added successfully', saved);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user record.');
    }
  }

  /**
   * ─── FIND ALL ───
   */
  async findAll(): Promise<ApiResponse<User[]>> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    users.forEach((u) => delete (u as any).password);
    return successResponse('Users listed successfully', users);
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

    this.userRepository.merge(user, updateUserDto);
    const updated = await this.userRepository.save(user);
    delete (updated as any).password;

    return successResponse('User updated successfully', updated);
  }

  /**
   * ─── REMOVE USER ───
   */
  async remove(id: string): Promise<ApiResponse<null>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User record not found.');

    await this.userRepository.remove(user);
    return successResponse('User deleted successfully', null);
  }
}
