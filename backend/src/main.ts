import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI assets
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter and logging interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS configuration
  app.enableCors({
    origin: true, // Allow all origins in dev, or configure via env
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // OpenAPI / Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Job Application Tracker REST API')
    .setDescription(
      'Production-grade RESTful API for tracking job & internship applications across their lifecycle, managing tailored resumes with AWS S3, scheduling interviews, recording notes, comparing offer packages, and AI ATS tailoring & email generation.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication, Registration, Login & Token Refresh')
    .addTag('Applications', 'Application Lifecycle, Kanban Stages & Pipeline Management')
    .addTag('Offers', 'Job Offer Compensation Packages & Comparison Matrix')
    .addTag('Resumes', 'Resume Vault & AWS S3 Presigned Uploads')
    .addTag('Interviews', 'Interview Rounds & Calendar Reminders')
    .addTag('Notes', 'Application Notes Timeline')
    .addTag('Notifications', 'Stale Application Scans & Email Dispatch (AWS SES)')
    .addTag('AI', 'Google Gemini AI ATS Resume Matching & Email Outreach Generator')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'JobTracker API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`JobTracker Backend running on http://localhost:${port}/api/v1`);
  console.log(`JobTracker Swagger Docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
