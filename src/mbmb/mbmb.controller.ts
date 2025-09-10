import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MbmbService } from './mbmb.service';

@ApiTags('MBMB')
@Controller('mbmb')
export class MbmbController {
    constructor(private readonly mbmb: MbmbService) { }

    @Get('health')
    async health() {
        try {
            await this.mbmb.get('/bill/online/test');
            return { ok: true };
        } catch (err: any) {
            return { ok: false, error: err?.message ?? err };
        }
    }

    /**
     * Proxy GET for public resources. Query param `path` should be the resource path under /mbmb/public/api
     * Example: GET /mbmb/public?path=mps&state=11 -> will call /mbmb/public/api/mps?state=11
     */
    @Get('public')
    async getPublic(@Query('path') path: string, @Query() query: any) {
        const resource = path;
        return this.mbmb.getPublicResource(resource, query);
    }

    /**
     * Proxy POST specifically for MBMB payment submit.
     * Frontend calls: POST /mbmb/public/api/payment/submit with the required payload.
     * This forwards to MBMB: /mbmb/public/api/payment/submit
     */
    @Post('public/api/payment/submit')
    async postPaymentSubmit(@Body() body: any) {
        return this.mbmb.postPublicResource('payment/submit', body);
    }
}
