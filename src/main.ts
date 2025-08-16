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
import express from 'express';
const version = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'http://172.17.10.66:3100', 'https://ixora.mbmb.gov.my', 'http://172.17.10.11'],
    credentials: true,
  });

  // 2. Cookie parser
  app.use(cookieParser());

  // 3. Excluded paths
  const csrfExcludedPaths = [
    { path: '/auth/login', method: 'POST' },
    { path: '/auth/logout', method: 'POST' },
    { path: '/uploads/file', method: 'POST' },
    { path: '/auth/guest-login', method: 'POST' },
    { path: '/auth/forgot-password', method: 'POST' },
    { path: '/auth/verify-reset-token', method: 'GET' },
    { path: '/auth/reset-password', method: 'POST' },
    { path: '/users', method: 'POST' },
    { path: '/hooks/ixora-backend', method: 'POST' },
    { path: '/hooks/ixora-backend', method: 'GET' },
  ];

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isExcluded = csrfExcludedPaths.some(
      (route) => route.path === req.path && route.method === req.method,
    );
    if (isExcluded) {
      console.log(`[CSRF] Skipped for ${req.method} ${req.path}`);
      return next();
    }

    console.log(`[CSRF] Checking for ${req.method} ${req.path}`);
    if (!req.cookies['_csrf']) {
      console.warn('⚠️ CSRF cookie "_csrf" not set yet');
    }

    return csurf({
      cookie: {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
      },
      value: (req) => req.headers['x-csrf-token'] as string || '',
    })(req, res, next);
  });


  // 5. CSRF error handler with reason
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      console.error('❌ CSRF Error — invalid token');
      console.error('→ [Expected] Cookie _csrf:', req.cookies['_csrf']);
      console.error('→ [Provided] Header x-csrf-token:', req.headers['x-csrf-token']);

      // If you're using csurf with secret stored on req
      if ((req as any).csrfToken && typeof (req as any).csrfToken === 'function') {
        try {
          const currentToken = (req as any).csrfToken();
          console.log('→ [Current Generated Token]:', currentToken);
        } catch (e) {
          console.log('→ Unable to generate token:', e.message);
        }
      } else {
        console.log('→ req.csrfToken is not available');
      }

      return res.status(403).json({ message: 'Invalid CSRF token' });
    }
    next(err);
  });

  // 6. Global stuff
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // 7. Start app
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server is running on http://localhost:${port}`);

  version.get('/version', (_req, res) => {
      res.json({
        sha: process.env.IMAGE_REVISION || process.env.GIT_SHA || 'unknown',
        builtAt: process.env.IMAGE_CREATED || 'unknown',
      });
    });
}
bootstrap();
