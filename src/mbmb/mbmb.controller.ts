import { Controller, Get, Query } from '@nestjs/common';
import { MbmbService } from './mbmb.service';

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
}
