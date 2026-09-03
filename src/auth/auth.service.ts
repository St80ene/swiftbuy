import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { addMinutes } from 'date-fns';

import { LoginDto } from './dto/login.dto';
import {
  ResetPasswordDto,
  ChangePasswordDto,
  ForgotPasswordDto,
} from './dto/password.dto';

import { User } from '../resources/users/entities/user.entity';
import { UserAuth } from './entities/user_auth.entity';

import { AuditLogsService } from '../resources/audit_logs/audit_logs.service';
import { AuditLogAction, AuditLogEntity } from '../common/enum/audit_log.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserAuth)
    private readonly userAuthRepository: Repository<UserAuth>,

    @Inject(AuditLogsService)
    private readonly auditLogService: AuditLogsService,

    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginDto) {
    const user = await this.validateCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.auditLogService.create({
      action: AuditLogAction.LOGIN,
      entity: AuditLogEntity.USER,
      entityId: user.id,
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    const auth = await this.userAuthRepository.findOneBy({
      user_id: userId,
    });

    if (!auth) {
      return {
        message: 'Logged out successfully',
      };
    }

    await this.userAuthRepository.update(
      { user_id: userId },
      {
        refresh_token: null,
      },
    );

    return {
      message: 'Logged out successfully',
    };
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: {
        business_email: email,
      },
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
        password_reset_expires_at: addMinutes(new Date(), 30),
      });

      await this.userAuthRepository.save(newAuth);
    } else {
      await this.userAuthRepository.update(
        { user_id: user.id },
        {
          password_reset_token: await bcrypt.hash(token, 10),
          password_reset_expires_at: addMinutes(new Date(), 30),
        },
      );
    }

    return {
      message: 'If an account exists, a reset link has been sent.',
    };
  }

  async passwordReset(dto: ResetPasswordDto) {
    const auth = await this.userAuthRepository.findOne({
      where: {
        password_reset_token: dto.token,
      },
      select: {
        id: true,
        user_id: true,
        password: true,
        password_reset_token: true,
        password_reset_expires_at: true,
      },
    });

    if (
      !auth ||
      !auth.password_reset_expires_at ||
      auth.password_reset_expires_at < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token');
    }

    const valid = await bcrypt.compare(
      dto.token,
      auth.password_reset_token as string,
    );

    if (!valid) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.userAuthRepository.update(
      { user_id: auth.user_id },
      {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires_at: null,
        refresh_token: null,
      },
    );

    return {
      message: 'Password reset successful',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const { currentPassword, newPassword } = dto;

    const auth = await this.userAuthRepository.findOne({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        user_id: true,
        password: true,
      },
    });

    if (!auth) {
      throw new UnauthorizedException('User not found');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password cannot be the same as the current password',
      );
    }

    const valid = await bcrypt.compare(
      currentPassword,
      auth.password as string,
    );

    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userAuthRepository.update(
      { user_id: userId },
      {
        password: hashedPassword,
        refresh_token: null,
      },
    );

    return {
      message: 'Password updated successfully',
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const auth = await this.userAuthRepository.findOne({
      where: {
        user_id: payload.sub,
      },
      select: {
        user_id: true,
        refresh_token: true,
      },
    });

    if (!auth?.refresh_token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const validRefreshToken = await bcrypt.compare(
      refreshToken,
      auth.refresh_token,
    );

    if (!validRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.sub,
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User is not active');
    }

    return this.generateTokens(user);
  }

  async me(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        business_email: true,
        role_id: true,
        business_id: true,
        store_id: true,
        is_active: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async validateCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        business_email: email,
      },
      relations: {
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const auth = await this.userAuthRepository.findOne({
      where: {
        user_id: user.id,
      },
      select: {
        user_id: true,
        password: true,
        failed_login_attempts: true,
        locked_until: true,
      },
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (auth.locked_until && auth.locked_until > new Date()) {
      throw new ForbiddenException('Account temporarily locked');
    }

    const valid = await bcrypt.compare(password, auth.password as string);

    if (!valid) {
      const failedLoginAttempts = (auth.failed_login_attempts ?? 0) + 1;

      const lockedUntil =
        failedLoginAttempts >= 5 ? addMinutes(new Date(), 15) : null;

      await this.userAuthRepository.update(
        { user_id: user.id },
        {
          failed_login_attempts: failedLoginAttempts,
          locked_until: lockedUntil,
        },
      );

      throw new UnauthorizedException('Invalid email or password');
    }

    await this.userAuthRepository.update(
      { user_id: user.id },
      {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    );

    return user;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.userAuthRepository.update(
      {
        user_id: user.id,
      },
      {
        refresh_token: refreshTokenHash,
      },
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
