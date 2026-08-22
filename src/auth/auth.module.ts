import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../resources/users/entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { jwtConstants } from './constants';
import { UserAuth } from './entities/user_auth.entity';
import { AuditLog } from '../resources/audit_logs/entities/audit_log.entity';
import { AuditLogsModule } from '../resources/audit_logs/audit_logs.module';
import { Role } from './entities/role.entity';
import { RolePermissions } from './entities/role_permissions.entity';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserAuth,
      AuditLog,
      Role,
      RolePermissions,
      Permission,
    ]),
    JwtModule.register({
      secret: jwtConstants.secret,
      global: true,
      signOptions: { expiresIn: '1h' },
    }),
    AuditLogsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
  ],
})
export class AuthModule {}
