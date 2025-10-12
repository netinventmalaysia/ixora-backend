// crypto polyfill for bcrypt on WebCrypto
import { webcrypto as crypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = crypto;
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import { Request, Response, NextFunction } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1) CORS
  app.enableCors({
    origin: [
      'https://ixora.mbmb.gov.my',
      'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  // 2) Cookies
  app.use(cookieParser());

  // 3) CSRF (cookie-based + header "x-csrf-token")
  const csrfExcluded = new Set([
    'POST /auth/login',
    'POST /auth/logout',
    'POST /uploads/file',
    'POST /auth/guest-login',
    'POST /auth/forgot-password',
    'GET  /auth/verify-reset-token',
    'POST /auth/reset-password',
    'GET /auth/verify-email/validate',
    'OPTIONS /auth/verify-email/validate',
    'POST /users',
    'POST /hooks/ixora-backend',
    'GET  /hooks/ixora-backend',
    // External callbacks shouldn't require CSRF
    'POST /billings/callback/mbmb',
    // Allow payment submit to be called without CSRF (no auth)
    'POST /billings/payment/submit',
  ]);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method} ${req.path}`;
    if (csrfExcluded.has(key)) {
      return next();
    }
    const sameSite = (process.env.CSRF_SAMESITE as any) || (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    const secure = process.env.CSRF_SECURE ? process.env.CSRF_SECURE === 'true' : process.env.NODE_ENV === 'production';
    return (csurf({
      cookie: {
        // With our flow we DON'T read this cookie in JS (we fetch token from /auth/csrf-token),
        // so make it HttpOnly and secure in prod.
        httpOnly: true,
        sameSite,
        secure,
      },
      value: (r) => (r.headers['x-csrf-token'] as string) || '',
    }) as any)(req, res, next);
  });

  // 4) CSRF error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    next(err);
  });

  // 5) Globals
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6) Swagger API docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('IXORA API')
    .setDescription('REST API documentation for IXORA backend')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Include JWT as: Bearer <token>'
      },
      'bearer'
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // 7) Attach /auth/csrf-token and /version to *Nest's* Express instance
  const server = app.getHttpAdapter().getInstance();

  // Returns a one-time CSRF token (GET is "safe" and allowed by csurf)
  server.get('/auth/csrf-token', (req: Request, res: Response) => {
    // csurf attaches req.csrfToken()
    const token = (req as any).csrfToken?.() ?? '';
    res.json({ csrfToken: token });
  });

  // Simple version endpoint
  server.get('/version', (_req: Request, res: Response) => {
    res.json({
      sha: process.env.NEST_PUBLIC_BUILD_SHA || 'unknown',
      builtAt: process.env.NEST_PUBLIC_BUILD_TIME || 'unknown',
    });
  });

  // 8) Start
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server listening on http://localhost:${port}`);
}
bootstrap();
