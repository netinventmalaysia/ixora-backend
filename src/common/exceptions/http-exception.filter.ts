import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception.getStatus();
        const res = exception.getResponse() as any;
        let message: string;
        if (typeof res === 'string') message = res;
        else if (res?.message) {
            if (Array.isArray(res.message)) message = res.message.join('; ');
            else message = String(res.message);
        } else if (res?.error) message = String(res.error);
        else message = exception.message || 'Unexpected error';

        response.status(status).json({
            success: false,
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
}
