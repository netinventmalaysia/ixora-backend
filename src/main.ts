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

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Allow frontend to send credentials (cookies)
  app.enableCors({
    origin: 'http://localhost:3001', // Adjust if in prod
    credentials: true,
  });

  //Correct order: cookieParser MUST come before csurf
  app.use(cookieParser());

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isLogin = req.path === '/auth/login' && req.method === 'POST';
    if (isLogin) return next();

    return csurf({
      cookie: {
        httpOnly: false,        // frontend must be able to read it
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'production',
      },
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
