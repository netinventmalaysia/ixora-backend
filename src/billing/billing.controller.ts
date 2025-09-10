import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { BillingService } from './billing.service';
import { InvoiceDto } from './dto/invoice.dto';
import { InsertOnlineBillDto } from './dto/insert-online-bill.dto';
import { CreateBillingDto } from './dto/create-billing.dto';
// Razer callback removed in favor of MBMB callback
import { MbmbCallbackDto } from './dto/mbmb-callback.dto';
import { PaymentSubmitDto } from './dto/payment-submit.dto';

@Controller(['billings', 'api/billings'])
export class BillingController {
  constructor(private readonly billing: BillingService) { }

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

  // POST /billings/insert -> forwards to MBMB Insert Online Bill
  @Post('insert')
  async insertOnlineBill(@Body() body: InsertOnlineBillDto) {
    try {
      return await this.billing.insertOnlineBill(body);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to insert online bill' }, HttpStatus.BAD_GATEWAY);
    }
  }

  // POST /billings -> create IXORA billing (CREATED) with items
  @Post()
  async create(@Body() body: CreateBillingDto) {
    try {
      return await this.billing.create(body);
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to create billing' }, HttpStatus.BAD_REQUEST);
    }
  }

  // MBMB payment callback (recommended)
  @Post('callback/mbmb')
  async mbmbCallback(@Body() body: MbmbCallbackDto) {
    try {
  await this.billing.handleMbmbCallback(body);
  return { data: 'ok' };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to process MBMB callback' }, HttpStatus.BAD_REQUEST);
    }
  }

  // Initiate payment via MBMB; returns URL for frontend redirection
  @Post('payment/submit')
  async submitPayment(@Body() body: PaymentSubmitDto) {
    try {
  // Debug: incoming request body
  console.log('[BillingController] submitPayment request body:', body);
  const result = await this.billing.submitPayment(body);
  console.log('[BillingController] submitPayment result:', result);
  return result;
    } catch (err: any) {
  // Debug: error details
  const errData = err?.response?.data ?? err?.message ?? err;
  console.error('[BillingController] submitPayment error:', errData);
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to create payment' }, HttpStatus.BAD_GATEWAY);
    }
  }
}
