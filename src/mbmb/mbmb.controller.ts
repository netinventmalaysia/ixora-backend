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

    // if success send payment type as "N"
    @Post('public/api/payment/submit')
    async postPaymentSubmit(@Body() body: any) {
        return this.mbmb.postPublicResource('bill/online/insert', body);
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
        return arr.map((it: any) => {
            // Identify context by presence of distinctive fields
            const isMisc = !!it?.no_akaun && !!it?.jumlah && !!it?.amaun_bil;
            const isCompound = !!it?.nokmp || !!it?.noicmilik;
            const isAssessment = !!it?.no_akaun && (!!it?.no_bil || !!it?.jumlah) && (it?.jenis === '01' || it?.cukai_sepenggal != null);
            // Booth context (jenis '02' observed) with rental-related fields like sewa/petak/selenggara
            const isBooth = it?.jenis === '02' && !!it?.no_akaun && (it?.sewa != null || it?.petak != null || it?.selenggara != null || it?.cukai_sepenggal != null);

            // id resolution
            let id = it?.id;
            if (!id) {
                if (isAssessment) id = it?.no_akaun || it?.no_bil;
                else if (isMisc) id = it?.no_akaun || it?.no_rujukan;
                else if (isCompound) id = it?.nokmp || it?.noicmilik;
                else id = it?.bill_no || it?.no || it?.reference || it?.ref || it?.seq;
            }
            if (id == null) id = '';

            // bill number resolution
            let billNo = it?.bill_no || it?.billNo;
            if (!billNo) {
                if (isAssessment) billNo = it?.no_bil || it?.no_akaun;
                else if (isMisc) billNo = it?.no_rujukan || it?.no_akaun;
                else if (isCompound) billNo = it?.nokmp;
                else billNo = it?.no || it?.reference || it?.ref || it?.seq;
            }
            billNo = String(billNo || '');

            // amount resolution (prefer explicit totals for misc)
            let amount: number | undefined;
            const amountCandidates = isAssessment
                ? [it?.jumlah, it?.cukai, it?.cukai_sepenggal, it?.amount]
                : isBooth
                    // For booth: prefer jumlah if >0; else sewa; else cukai_sepenggal; else any non-zero maintenance related amounts.
                    ? [
                        it?.jumlah,
                        it?.sewa,
                        it?.cukai_sepenggal,
                        it?.selenggara,
                        it?.air,
                        it?.denda,
                        it?.amaun,
                        it?.amount,
                    ]
                    : [
                        it?.amount,
                        it?.jumlah, // misc/assessment total
                        it?.amaun_bil, // misc bill amount
                        it?.total,
                        it?.value,
                        it?.amnterkini,
                        it?.amnkmp,
                        it?.amaun,
                    ];
            for (const c of amountCandidates) {
                if (c != null && c !== '') {
                    const n = typeof c === 'number' ? c : Number(c);
                    if (!isNaN(n)) { amount = n; if (n !== 0) break; }
                }
            }
            if (typeof amount !== 'number' || isNaN(amount)) amount = 0;

            // due date
            let dueDate = it?.due_date || it?.dueDate || it?.expiry || it?.date || it?.trkhkmp || it?.trk_end_bayar || it?.trk_bil;
            if (dueDate == null) dueDate = '';
            dueDate = String(dueDate);

            // description
            let description = it?.description || it?.desc || it?.title || it?.butirsalah;
            if (!description && isMisc) description = it?.catitan1 || it?.catitan2 || undefined;
            if (!description && isBooth) {
                // Build a concise booth description: month/year + optional remark
                const period = it?.mmyyyy ? String(it.mmyyyy).trim() : undefined;
                const note = it?.catitan1 ? String(it.catitan1).trim() : undefined;
                description = [period, note].filter(Boolean).join(' - ') || undefined;
            }

            return { id, bill_no: billNo, amount, due_date: dueDate, description };
        });
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
        // Upstream pattern (similar to compound/misc): /assessment?columnName=...&columnValue=...
        // Priority: bill_no > account_no/assessment_no > ic
        const ic = query.ic || query.no_kp;
        const accountNo = query.account_no || query.assessment_no;
        const billNo = query.bill_no;
        let columnName: 'no_bil' | 'no_akaun' | 'no_kp' | undefined;
        let columnValue: string | undefined;
        if (billNo) { columnName = 'no_bil'; columnValue = billNo; }
        else if (accountNo) { columnName = 'no_akaun'; columnValue = accountNo; }
        else if (ic) { columnName = 'no_kp'; columnValue = ic; }
        if (!columnName || !columnValue) {
            throw new BadRequestException({ error: 'BadRequest', message: 'Provide either ic or account_no' });
        }
        // Correct upstream path is assessment-tax
        const raw = await this.mbmb.getPublicResource('assessment-tax', { columnName, columnValue });
        return { data: this.mapToBills(raw) };
    }

    @Get('public/api/compound/outstanding')
    @ApiOperation({ summary: 'List outstanding compound bills' })
    @ApiResponse({ status: 200, description: '{ data: CompoundBill[] }' })
    async getCompoundOutstanding(@Req() req: Request, @Query() query: CompoundOutstandingQueryDto) {
        this.ensureRateLimit(req, 'compound');
        // Use generic endpoint with columnName/columnValue
        // Mapping priority: compound_no -> nokmp, else ic/no_kp/noicmilik -> noicmilik, else vehicle_registration_no -> nodaftar
        const ic = query.ic || query.no_kp || query.noicmilik;
        const compoundNo = query.compound_no;
        const vehicleReg = query.vehicel_registration_no || query.vehicle_registration_no;
        let columnName: 'nokmp' | 'noicmilik' | 'nodaftar' | undefined;
        let columnValue: string | undefined;
        if (compoundNo) { columnName = 'nokmp'; columnValue = compoundNo; }
        else if (ic) { columnName = 'noicmilik'; columnValue = ic; }
        else if (vehicleReg) { columnName = 'nodaftar'; columnValue = vehicleReg; }
        if (!columnName || !columnValue) {
            throw new BadRequestException({ error: 'BadRequest', message: 'Provide either ic or compound_no' });
        }
        const raw = await this.mbmb.getPublicResource('compound', { columnName, columnValue });
        return { data: this.mapToBills(raw) };
    }

    @Get('public/api/booth/outstanding')
    @ApiOperation({ summary: 'List outstanding booth rental bills' })
    @ApiResponse({ status: 200, description: '{ data: BoothBill[] }' })
    async getBoothOutstanding(@Req() req: Request, @Query() query: BoothOutstandingQueryDto) {
        this.ensureRateLimit(req, 'booth');
        // New upstream generic pattern: /booth-rental?columnName=...&columnValue=...
        // Priority mapping (FE -> Upstream column): account_no/booth_no -> no_akaun, ic/no_kp -> no_kp
        const ic = query.ic || query.no_kp;
        const accountNo = query.account_no || query.booth_no; // booth_no legacy support
        let columnName: 'no_kp' | 'no_akaun' | undefined;
        let columnValue: string | undefined;
        if (ic) { columnName = 'no_kp'; columnValue = ic; }
        else if (accountNo) { columnName = 'no_akaun'; columnValue = accountNo; }
        if (!columnName || !columnValue) {
            throw new BadRequestException({ error: 'BadRequest', message: 'Provide either ic or account_no' });
        }
        const raw = await this.mbmb.getPublicResource('booth-rental', { columnName, columnValue });
        return { data: this.mapToBills(raw) };
    }

    @Get('public/api/misc/outstanding')
    @ApiOperation({ summary: 'List outstanding miscellaneous bills' })
    @ApiResponse({ status: 200, description: '{ data: MiscBill[] }' })
    async getMiscOutstanding(@Req() req: Request, @Query() query: MiscOutstandingQueryDto) {
        this.ensureRateLimit(req, 'misc');
        // Mapping (FE -> Upstream): account_no -> no_akaun, ic/no_kp -> no_kp
        const ic = query.ic || query.no_kp;
        const accountNo = query.account_no || query.misc_no || query.bill_no; // legacy support
        const key = this.validateOneOf({ ic, accountNo }, ['ic', 'accountNo']);
        const params: any = key === 'ic'
            ? { columnName: 'no_kp', columnValue: ic }
            : { columnName: 'no_akaun', columnValue: accountNo };
        // New MBMB path for miscellaneous bills via generic columnName/columnValue
        const raw = await this.mbmb.getPublicResource('miscellaneous-bills', params);
        return { data: this.mapToBills(raw) };
    }
}
