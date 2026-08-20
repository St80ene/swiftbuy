import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ChangeUserRoleDto, CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../decorators/roles.decorator';
import { UserRole } from '../../enum/user_role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // @UseGuards(AuthGuard('jwt'))
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(@Request() req: Request, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, req['user']);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.usersService.findAll({ page, limit });
  }

  @Patch(':id')
  // @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Request() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto, req['user']);
  }

  // @Patch(':id/role')
  // @Roles(UserRole.SUPER_ADMIN)
  changeRole(
    @Request() req: Request,
    @Param('id') id: string,
    @Body() dto: ChangeUserRoleDto,
    // @CurrentUser() currentUser: JwtUser,
  ) {
    return this.usersService.changeRole(id, dto, req['user']);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Request() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id, req['user']);
  }
}
