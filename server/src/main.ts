import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './common/filters/execption.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { createWinstonLogger } from './core/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: createWinstonLogger(process.env.NODE_ENV === 'development'),
  });
  const configService = app.get(ConfigService);

  // Add global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  // Add global interceptor for consistent responses
  app.useGlobalInterceptors(new TransformInterceptor());

  // Add global exception filter
  app.useGlobalFilters(new ExceptionsFilter());

  // Enable CORS
  app.enableCors({
    origin: configService.get('app.cors.origin'),
    credentials: configService.get('app.cors.credentials'),
  });

  // Simple health check endpoint
  app.getHttpAdapter().get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
  });

  // API prefix
  const apiPrefix = configService.get('app.apiPrefix');
  app.setGlobalPrefix(apiPrefix);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('UPNVJ Forum API')
    .setDescription('The UPNVJ Forum API documentation')
    .setVersion('1.0')
    .addTag('Auth', 'Authentication API')
    .addTag('Users', 'Users API')
    .addTag('Discussions', 'Discussions API')
    .addTag('Spaces', 'Discussion Spaces API')
    .addTag('Comments', 'Comments API')
    .addTag('Reports', 'Reports API')
    .addTag('Votes', 'Votes API')
    .addTag('Notifications', 'Notifications API')
    .addTag('Admin', 'Admin API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Serve static files
  app.useStaticAssets('uploads', {
    prefix: '/uploads',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
