import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuditLogAction, AuditLogEntity } from '../enum/audit_log.enum';
import { AuditLogsService } from '../resources/audit_logs/audit_logs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../resources/users/entities/user.entity';
import { Repository } from 'typeorm';
import { UserAuth } from './entities/user_auth.entity';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import {
  ResetPasswordDto,
  ChangePasswordDto,
  ForgotPasswordDto,
} from './dto/password.dto';
import { JwtService } from '@nestjs/jwt';
import { addMinutes } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAuth)
    private readonly userAuthRepository: Repository<UserAuth>,
    private readonly auditLogService: AuditLogsService,
    private jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.validateCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    const auth = await this.userAuthRepository.findOneBy({
      user_id: user.id,
    });

    if (!auth) {
      throw new Error('UserAuth record not found for user');
    }

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    if (!hashedRefreshToken) {
      throw new Error('Failed to hash refresh token');
    }

    auth['refresh_token'] = hashedRefreshToken;

    await this.userAuthRepository.save(auth);

    await this.auditLogService.create({
      action: AuditLogAction.LOGIN,
      entity: AuditLogEntity.USER,
      entityId: user.id,
    });

    return {
      user,
      refreshToken,
      accessToken,
    };
  }

  async logout(userId: string) {
    const auth = await this.userAuthRepository.findOneBy({
      user_id: userId,
    });

    if (!auth)
      return {
        message: 'Logged out successfully',
      };

    auth.refresh_token = null;

    await this.userAuthRepository.save(auth);

    return {
      message: 'Logged out successfully',
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return {
        message: 'If an account exists, a reset link has been sent.',
      };
    }

    const auth = await this.userAuthRepository.findOneBy({
      user_id: user.id,
    });

    const token = randomBytes(32).toString('hex');

    if (!auth) {
      const newAuth = this.userAuthRepository.create({
        user_id: user.id,
        password_reset_token: await bcrypt.hash(token, 10),
        password_reset_expires_at: new Date(),
      });

      await this.userAuthRepository.save(newAuth);
    } else {
      auth.password_reset_token = await bcrypt.hash(token, 10);
      auth.password_reset_expires_at = addMinutes(new Date(), 30);

      await this.userAuthRepository.save(auth);
    }

    // await this.mailService.sendResetPassword(user.email, token);

    return {
      message: 'If an account exists, a reset link has been sent.',
    };
  }

  //   auth.password_reset_token = await bcrypt.hash(token);

  //   auth.password_reset_expires_at = addMinutes(new Date(), 30);

  //   await this.userAuthRepository.save(auth);

  //   await this.mailService.sendResetPassword(user.email, token);

  //   return {
  //     message: 'If an account exists, a reset link has been sent.',
  //   };
  // }

  async passwordReset(dto: ResetPasswordDto) {
    const auth = await this.userAuthRepository.findOne({
      where: { password_reset_token: dto.token },
      select: {
        password_reset_token: true,
        password_reset_expires_at: true,
      },
    });

    if (
      !auth ||
      !auth.password_reset_expires_at ||
      auth.password_reset_expires_at < new Date()
    )
      throw new BadRequestException('Invalid or expired token');

    const valid = await bcrypt.compare(
      dto.token,
      auth.password_reset_token as string,
    );

    if (!valid) throw new BadRequestException();

    auth.password = await bcrypt.hash(dto.newPassword, 10);

    auth.password_reset_token = null;
    auth.password_reset_expires_at = null;
    auth.refresh_token = null;

    await this.userAuthRepository.save(auth);

    return {
      message: 'Password reset successful',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;
    const auth: UserAuth | null = await this.userAuthRepository.findOne({
      where: { user_id: userId },
      select: {
        password: true,
      },
    });

    if (!auth) throw new UnauthorizedException('User not found');

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the current password',
      );
    }

    const valid = await bcrypt.compare(
      currentPassword,
      auth.password as string,
    );

    if (!valid)
      throw new UnauthorizedException('Current password is incorrect');

    auth.password = await bcrypt.hash(dto.newPassword, 10);

    auth.refresh_token = null;

    await this.userAuthRepository.save(auth);

    return {
      message: 'Password updated successfully',
    };
  }

  async refresh(refreshToken: string) {
    const payload: Record<string, any> =
      await this.jwtService.verifyAsync(refreshToken);

    const auth = await this.userAuthRepository.findOne({
      where: {
        user_id: payload?.sub as string,
      },
      select: {
        refresh_token: true,
      },
    });

    if (!auth) throw new UnauthorizedException();

    const user = await this.userRepository.findOneBy({
      id: payload?.sub as string,
    });

    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user);
  }

  async me(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: {
        role: { rolePermissions: true },
      },
      select: {
        id: true,
        email: true,
        role: {
          id: true,
          name: true,
          description: true,
          rolePermissions: true,
        },
      },
    });
  }

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: {
        role: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid email or password');

    const auth = await this.userAuthRepository.findOne({
      where: {
        user_id: user.id,
      },
      select: {
        password: true,
        failed_login_attempts: true,
        locked_until: true,
      },
    });

    if (!auth) throw new UnauthorizedException();

    if (auth.locked_until && auth.locked_until > new Date()) {
      throw new ForbiddenException('Account temporarily locked');
    }

    const valid = await bcrypt.compare(password, auth.password as string);

    if (!valid) {
      auth.failed_login_attempts = auth.failed_login_attempts
        ? auth.failed_login_attempts + 1
        : 1;

      if (auth?.failed_login_attempts >= 5) {
        auth.locked_until = addMinutes(new Date(), 15);
      }

      await this.userAuthRepository.save(auth);

      throw new UnauthorizedException('Invalid email or password');
    }

    auth.failed_login_attempts = 0;
    auth.locked_until = null;
    auth.last_login_at = new Date();

    await this.userAuthRepository.save(auth);

    return user;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      role_id: user.role_id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    if (!accessToken) {
      throw new Error('Failed to generate access token');
    }

    const refreshToken: string = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    if (!refreshToken) {
      throw new Error('Failed to generate refresh token');
    }

    return {
      accessToken,
      refreshToken,
    };
  }
}
