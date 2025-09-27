import { Body, Controller, Get, Post, Query, BadRequestException, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MbmbService } from './mbmb.service';
import { Request } from 'express';
import { SimpleRateLimiter } from '../common/utils/rate-limit.util';
import { AssessmentOutstandingQueryDto, BoothOutstandingQueryDto, CompoundOutstandingQueryDto, MiscOutstandingQueryDto, PublicBill } from './dto/outstanding.dto';

@ApiTags('MBMB')
@Controller('mbmb')
export class MbmbController {
    constructor(private readonly mbmb: MbmbService) { }

    // Simple per-IP rate limiter for public lookups: 30 requests per 60s per route
    private static rl = new SimpleRateLimiter(60_000, 30);

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

    // ---------- Outstanding bills (normalized) ----------

    private validateOneOf(params: Record<string, any>, keys: string[]) {
        const present = keys.filter((k) => !!params[k]);
        if (present.length === 0) {
            throw new BadRequestException({ error: 'BadRequest', message: `Provide either ${keys.join(' or ')}` });
        }
        return present[0];
    }

    private mapToBills(raw: any): PublicBill[] {
        // Accept array or objects; try to normalize common MBMB shapes
        const arr = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
        return arr.map((it: any) => ({
            id: it?.id ?? it?.bill_no ?? it?.no ?? it?.reference ?? it?.ref ?? it?.seq ?? '',
            bill_no: String(it?.bill_no ?? it?.billNo ?? it?.no ?? it?.reference ?? it?.ref ?? it?.seq ?? ''),
            amount: typeof it?.amount === 'number' ? it.amount : Number(it?.amount ?? it?.total ?? it?.value ?? 0),
            due_date: String(it?.due_date ?? it?.dueDate ?? it?.expiry ?? it?.date ?? ''),
            description: it?.description ?? it?.desc ?? it?.title ?? undefined,
        }));
    }

    private ensureRateLimit(req: Request, bucket: string) {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
        const key = `${ip}:${bucket}`;
        if (!MbmbController.rl.take(key)) {
            throw new HttpException({ error: 'TooManyRequests', message: 'Rate limit exceeded' }, HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Get('public/api/assessment/outstanding')
    @ApiOperation({ summary: 'List outstanding assessment bills' })
    @ApiResponse({ status: 200, description: '{ data: AssessmentBill[] }' })
    async getAssessmentOutstanding(@Req() req: Request, @Query() query: AssessmentOutstandingQueryDto) {
        this.ensureRateLimit(req, 'assessment');
        const key = this.validateOneOf(query as any, ['ic', 'assessment_no']);
        const params: any = key === 'ic' ? { ic: query.ic } : { assessment_no: query.assessment_no };
        const raw = await this.mbmb.getPublicResource('assessment/outstanding', params);
        return { data: this.mapToBills(raw) };
    }

    @Get('public/api/compound/outstanding')
    @ApiOperation({ summary: 'List outstanding compound bills' })
    @ApiResponse({ status: 200, description: '{ data: CompoundBill[] }' })
    async getCompoundOutstanding(@Req() req: Request, @Query() query: CompoundOutstandingQueryDto) {
        this.ensureRateLimit(req, 'compound');
        const key = this.validateOneOf(query as any, ['ic', 'compound_no']);
        const params: any = key === 'ic' ? { ic: query.ic } : { compound_no: query.compound_no };
        const raw = await this.mbmb.getPublicResource('compound/outstanding', params);
        return { data: this.mapToBills(raw) };
    }

    @Get('public/api/booth/outstanding')
    @ApiOperation({ summary: 'List outstanding booth rental bills' })
    @ApiResponse({ status: 200, description: '{ data: BoothBill[] }' })
    async getBoothOutstanding(@Req() req: Request, @Query() query: BoothOutstandingQueryDto) {
        this.ensureRateLimit(req, 'booth');
        const key = this.validateOneOf(query as any, ['ic', 'booth_no']);
        const params: any = key === 'ic' ? { ic: query.ic } : { booth_no: query.booth_no };
        const raw = await this.mbmb.getPublicResource('booth/outstanding', params);
        return { data: this.mapToBills(raw) };
    }

    @Get('public/api/misc/outstanding')
    @ApiOperation({ summary: 'List outstanding miscellaneous bills' })
    @ApiResponse({ status: 200, description: '{ data: MiscBill[] }' })
    async getMiscOutstanding(@Req() req: Request, @Query() query: MiscOutstandingQueryDto) {
        this.ensureRateLimit(req, 'misc');
        // accept alias bill_no
        const misc_no = query.misc_no || query.bill_no;
        const q = { ...query, misc_no } as any;
        const key = this.validateOneOf(q, ['ic', 'misc_no']);
        const params: any = key === 'ic' ? { ic: query.ic } : { misc_no };
        const raw = await this.mbmb.getPublicResource('misc/outstanding', params);
        return { data: this.mapToBills(raw) };
    }
}
