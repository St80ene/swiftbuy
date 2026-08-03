import { Injectable, UnauthorizedException } from '@nestjs/common';
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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserAuth)
    private readonly userAuthRepository: Repository<UserAuth>,
    private readonly auditLogService: AuditLogsService,
  ) {}
  async login({ email, password }: LoginDto) {
    const user = await this.validateCredentials(email, password);

    const tokens = await this.generateTokens(user);

    await this.auditLogService.create({
      action: AuditLogAction.LOGIN,
      entity: AuditLogEntity.USER,
      entityId: user.id,
    });

    return {
      user,
      ...tokens,
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

  async forgotPassword(email: string) {
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
      const newAuth = this.userAuthRepository.save({
        user_id: user.id,
        password_reset_token: await bcrypt.hash(token, 10),
        password_reset_expires_at: new Date(), 30),
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

    const valid = await bcrypt.compare(dto.token, auth.password_reset_token);

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
    const auth = await this.userAuthRepository.findOne({
      where: { userId },
      select: ['password'],
    });

    const valid = await argon2.verify(auth.password, dto.oldPassword);

    if (!valid) throw new UnauthorizedException();

    auth.password = await argon2.hash(dto.newPassword);

    auth.refresh_token = null;

    await this.userAuthRepository.save(auth);

    return {
      message: 'Password updated successfully',
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync(refreshToken);

    const auth = await this.userAuthRepository.findOne({
      where: {
        userId: payload.sub,
      },
      select: ['refresh_token'],
    });

    if (!auth || !(await argon2.verify(auth.refresh_token, refreshToken)))
      throw new UnauthorizedException();

    const user = await this.userRepository.findOneBy({
      id: payload.sub,
    });

    return this.generateTokens(user);
  }

  async me(userId: string) {
    return this.userRepository.findOne({
      where: {
        id: userId,
      },
      relations: {
        role: {
          permissions: true,
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
      select: ['password', 'failed_login_attempts', 'locked_until'],
    });

    if (!auth) throw new UnauthorizedException();

    if (auth.locked_until && auth.locked_until > new Date()) {
      throw new ForbiddenException('Account temporarily locked');
    }

    const valid = await argon2.verify(auth.password, password);

    if (!valid) {
      auth.failed_login_attempts++;

      if (auth.failed_login_attempts >= 5) {
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
      roleId: user.roleId,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    const auth = await this.userAuthRepository.findOneBy({
      user_id: user.id,
    });

    auth.refresh_token = await argon2.hash(refreshToken);

    await this.userAuthRepository.save(auth);

    return {
      accessToken,
      refreshToken,
    };
  }
}
function addMinutes(arg0: Date, arg1: number): any {
  throw new Error('Function not implemented.');
}

