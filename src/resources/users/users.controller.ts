import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from './users.service';
import { ChangeUserRoleDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { UserRole } from '../../common/enum/user_role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { User } from './entities/user.entity';

import { ApiResponse } from '../../common/utils/response.utils';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { BasePaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create user
   */
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('profile_image'))
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createUserDto: CreateUserDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5MB
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file?: Express.Multer.File,
  ): Promise<ApiResponse<User | null>> {
    return this.usersService.create(createUserDto, currentUser, file);
  }

  /**
   * Get users
   */
  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(@Query() query: BasePaginationQueryDto) {
    return this.usersService.findAll(query);
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
  @UseInterceptors(FileInterceptor('profile_image'))
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5MB
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file?: Express.Multer.File,
  ): Promise<ApiResponse<User>> {
    return this.usersService.update(id, updateUserDto, currentUser, file);
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
