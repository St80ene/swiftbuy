import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { ChangeUserRoleDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserRole } from '../../common/enum/user_role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { User } from './entities/user.entity';

import { ApiResponse } from '../../common/utils/response.utils';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create user
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<User | null>> {
    return this.usersService.create(createUserDto, currentUser);
  }

  /**
   * Get users
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
  ) {
    return this.usersService.findAll({
      page,
      limit,
    });
  }

  /**
   * Get one user
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<User>> {
    return this.usersService.findOne(id);
  }

  /**
   * Update own profile
   */
  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<User>> {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  /**
   * Change user role
   */
  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  changeRole(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserRoleDto,
  ): Promise<ApiResponse<User>> {
    return this.usersService.changeRole(id, dto, currentUser);
  }

  /**
   * Deactivate user
   */
  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  deactivate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<null>> {
    return this.usersService.deactivate(id, currentUser);
  }

  /**
   * Activate user
   */
  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  activate(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<User>> {
    return this.usersService.activate(id, currentUser);
  }
}
