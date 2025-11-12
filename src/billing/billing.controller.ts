import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { InvoiceDto } from './dto/invoice.dto';
import { InsertOnlineBillDto } from './dto/insert-online-bill.dto';
import { CreateBillingDto } from './dto/create-billing.dto';
// Razer callback removed in favor of MBMB callback
import { MbmbCallbackDto } from './dto/mbmb-callback.dto';
import { PaymentSubmitDto } from './dto/payment-submit.dto';
import { CheckoutOutstandingDto } from './dto/checkout-outstanding.dto';

@ApiTags('Billings')
@ApiBearerAuth('bearer')
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

  // GET /billings/receipt?reference=XXX -> get billing receipt/status by reference
  @Get('receipt')
  @ApiOperation({ summary: 'Get billing receipt by reference' })
  async getReceipt(@Query('reference') reference?: string) {
    if (!reference) {
      throw new HttpException({ error: 'Missing reference parameter' }, HttpStatus.BAD_REQUEST);
    }
    try {
      const data = await this.billing.findByReference(reference);
      return { data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to fetch billing receipt' }, HttpStatus.NOT_FOUND);
    }
  }

  // GET /billings/:reference -> poll billing/session status
  @Get(':reference')
  async getByReference(@Param('reference') reference: string) {
    try {
      const data = await this.billing.findByReference(reference);
      return { data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to fetch billing' }, HttpStatus.NOT_FOUND);
    }
  }

  // GET /billings/items/by-bill-no?bill_no=XYZ -> search items by external bill number
  @Get('items/by-bill-no')
  @ApiOperation({ summary: 'Find billing items by bill_no' })
  async findItemsByBillNo(@Query('bill_no') bill_no?: string) {
    try {
      const data = await this.billing.findItemsByBillNo(bill_no || '');
      return { data };
    } catch (err: any) {
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to search items' }, HttpStatus.BAD_REQUEST);
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
  @ApiOperation({ summary: 'Submit payment to MBMB (public)', description: 'No auth, CSRF-exempt', security: [] })
  async submitPayment(@Body() body: PaymentSubmitDto) {
    try {
      const result = await this.billing.submitPayment(body);
      return result;
    } catch (err: any) {
      // Debug: error details
      const errData = err?.response?.data ?? err?.message ?? err;
      console.error('[BillingController] submitPayment error:', errData);
      if (err instanceof HttpException) throw err;
      throw new HttpException({ error: err?.message || 'Failed to create payment' }, HttpStatus.BAD_GATEWAY);
    }
  }

  // Aggregate outstanding bills and initiate payment (multi-bill checkout)
  @Post('checkout')
  async checkout(@Body() body: CheckoutOutstandingDto) {
    try {
      const result = await this.billing.checkoutOutstanding(body);
      return { data: result };
    } catch (err: any) {
      const errData = err?.response?.data ?? err?.message ?? err;
      console.error('[BillingController] checkout error:', errData);
      throw new HttpException({ error: err?.message || 'Failed to checkout bills' }, HttpStatus.BAD_REQUEST);
    }
  }
}
