import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Get('auth/logout/:id')
  logout(@Param('id') id: string) {
    return this.authService.logout(id);
  }

  @Get(':id')
  resetPassword(@Param('id') id: string) {
    // return this.authService.re(id);
  }
}
