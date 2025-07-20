import * as crypto from 'crypto';
(global as any).crypto = crypto;

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Allow frontend to send credentials (cookies)
  app.enableCors({
    origin: 'http://localhost:3001', // Adjust if in prod
    credentials: true,
  });

  // app.enableCors({
  //   origin: 'http://localhost:3000',  // ✅ Must match frontend origin
  //   credentials: true,                // ✅ Must be true for cookies
  // });

  //Correct order: cookieParser MUST come before csurf
  app.use(cookieParser());

  // Define paths that bypass CSRF
  const csrfExcludedPaths = [
    { path: '/users', method: 'POST' },
    { path: '/auth/login', method: 'POST' },
    { path: '/auth/guest-login', method: 'POST' },
    { path: '/auth/forgot-password', method: 'POST' },
    { path: '/auth/verify-reset-token', method: 'GET' },
    { path: '/auth/reset-password', method: 'POST' },
    { path: '/auth/logout', method: 'POST' },
    { path: '/uploads/file', method: 'POST' },
  ];

  app.useLogger(['log', 'debug', 'error', 'warn']);

  // CSRF exclusion middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isExcluded = csrfExcludedPaths.some(
      (route) => route.path === req.path && route.method === req.method,
    );
    if (isExcluded) {
      console.log('CSRF Skipped:', req.path, req.method);
      return next();
    }
    return csurf({
      cookie: {
        httpOnly: false, // optional - make true in production
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'production',
      },
      value: (req) => req.headers['x-csrf-token'] as string || '',
    })(req, res, next);
  });

  // Global validation and error handling
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('MBMB GO API')
    .setDescription('API documentation') // duplicated line removed
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
