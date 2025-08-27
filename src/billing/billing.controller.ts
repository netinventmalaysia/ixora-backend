import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { InvoiceDto } from './dto/invoice.dto';

@Controller(['billings', 'api/billings'])
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  async findAll(@Query('business_id') businessId?: string): Promise<InvoiceDto[]> {
    try {
      const id = businessId ? parseInt(businessId, 10) : undefined;
      if (businessId && (isNaN(id!) || id! <= 0)) {
        throw new HttpException({ error: 'Invalid business_id' }, HttpStatus.BAD_REQUEST);
      }
      return await this.billing.listInvoices(id);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to fetch billings' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
