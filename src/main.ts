import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createLoggerConfig } from './common/logger/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createLoggerConfig(),
  }); // Use the dynamic logger configuration
  // Retrieve ConfigService instance
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  app.enableCors({
    origin: '*',
  });
  // 1. SECURE HTTP HEADERS (Helmet)
  app.use(helmet());

  // 2. TRUST PROXY (Critical for deployment!)
  // If your server sits behind a reverse proxy (like Nginx, Heroku, AWS ALB, digitalOcean)
  // this ensures the rate limiter reads the client's actual IP, not the proxy's server IP.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const expressApp = app.getHttpAdapter().getInstance();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  expressApp.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');

  // Enable global validation and automatic type transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips away properties that don't belong in the DTO
      transform: true, // Auto-transforms strings to numbers/booleans based on DTO types
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Bind ClassSerializerInterceptor globally to apply @Exclude()
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(port);
}

bootstrap().catch(console.error);
