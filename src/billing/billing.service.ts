import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceDto } from './dto/invoice.dto';
import { Business } from '../business/registration/business.entity';
import { MbmbService } from '../mbmb/mbmb.service';
import { format } from 'date-fns';
import { InsertOnlineBillDto } from './dto/insert-online-bill.dto';
import { Billing } from './billing.entity';
import { BillingStatus } from './billing-status.enum';
import { BillingItem } from './billing.item.entity';
import { CreateBillingDto } from './dto/create-billing.dto';
// Razer callback removed; using MBMB callback instead
import { MbmbCallbackDto } from './dto/mbmb-callback.dto';
import { Payment } from './payment.entity';
import { PaymentSubmitDto } from './dto/payment-submit.dto';
import { CheckoutOutstandingDto } from './dto/checkout-outstanding.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(Billing) private readonly billingRepo: Repository<Billing>,
    @InjectRepository(BillingItem) private readonly billingItemRepo: Repository<BillingItem>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    private readonly mbmb: MbmbService,
  ) { }

  // Contract: returns array of InvoiceDto (empty array if none)
  async listInvoices(businessId?: number): Promise<InvoiceDto[]> {
    if (!businessId) {
      // For now, without a specific business, return an empty array.
      // We can later extend to aggregate across businesses for the user.
      return [];
    }

    const business = await this.businessRepo.findOne({ where: { id: businessId } });
    if (!business) throw new NotFoundException(`Business ${businessId} not found`);

    // Choose identifier to query MBMB: prefer registrationNumber
    const regNo = business.registrationNumber?.trim();
    if (!regNo) {
      return [];
    }

    // Call MBMB: Example endpoint assumptions based on MBMB docs
    // We'll try a generic proxy using the public API path. If the exact endpoint differs,
    // adjust 'resourcePath' accordingly (kept configurable).
    const resourcePath = process.env.MBMB_BILLINGS_RESOURCE || `bill/online/invoices`;

    // Build params: assume regNo is the filter key; add pagination defaults.
    const params: Record<string, any> = {
      reg_no: regNo,
      page: 1,
      per_page: 20,
    };

    let payload: any;
    try {
      payload = await this.mbmb.getPublicResource(resourcePath, params);
    } catch (e) {
      // Surface as empty list to keep UI flowing; logs/monitoring can capture errors
      return [];
    }

    // Normalize various possible shapes into an array of items
    const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];

    const now = new Date();
    const asInvoice = (row: any, idx: number): InvoiceDto => {
      const dt = row?.date || row?.created_at || now.toISOString();
      const iso = new Date(dt).toISOString();
      const human = format(new Date(iso), 'MMMM d, yyyy');
      const amountNumber = Number(row?.amount ?? row?.total ?? 0);
      const currency = row?.currency || 'MYR';
      const formatted = `${currency === 'MYR' ? 'RM ' : ''}${amountNumber.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const status = row?.status || row?.payment_status || 'Pending';

      return {
        id: row?.id ?? idx + 1,
        name: row?.name || row?.title || 'Invoice',
        business_id: businessId,
        lastInvoice: {
          id: row?.invoice_id ?? row?.id,
          date: human,
          dateTime: iso,
          amount: formatted,
          status: String(status),
        },
        dueDate: row?.due_date ? new Date(row.due_date).toISOString() : undefined,
        outstandingAmount: Number(row?.outstanding ?? 0) || undefined,
        currency,
        customer_ic: row?.customer_ic || row?.ic || undefined,
      };
    };

    return items.map(asInvoice);
  }

  async insertOnlineBill(body: InsertOnlineBillDto): Promise<any> {
    // Transform to MBMB expected payload key casing
    const payload = {
      OrderNo: body.orderNo,
      OrderTime: body.orderTime,
      OrderBank: body.orderBank,
      OrderAmount: body.orderAmount,
      OrderStatus: body.orderStatus,
      UserId: body.userId,
      IPAddress: body.ipAddress,
      BuyerEmail: body.buyerEmail,
      TransactionResponseCode: body.transactionResponseCode ?? '00',
      TransactionId: body.transactionId,
      TransactionTime: body.transactionTime,
      TransactionBank: body.transactionBank,
      TransactionRefNo: body.transactionRefNo,
      TransactionAmount: body.transactionAmount,
      OnlineTransactionAcct: body.onlineTransactionAcct.map((acct) => ({
        order_no: acct.order_no,
        jenis: acct.jenis,
        no_akaun: acct.no_akaun,
        amaun: acct.amaun,
      })),
    };

    const resourcePath = process.env.MBMB_INSERT_RESOURCE || 'bill/online/insert';
    const result = await this.mbmb.postPublicResource(resourcePath, payload);
    return result;
  }

  // Create a billing with items in CREATED status
  async create(dto: CreateBillingDto): Promise<Billing> {
    const total = dto.items.reduce((sum, it) => sum + Number(it.amaun || 0), 0);
    const billing = this.billingRepo.create({
      reference: dto.reference,
      businessId: dto.businessId,
      userId: dto.userId,
      status: BillingStatus.CREATED,
      totalAmount: total,
      currency: 'MYR',
      items: dto.items.map((it) =>
        this.billingItemRepo.create({
          order_no: it.order_no,
          jenis: it.jenis,
          no_akaun: it.no_akaun,
          amaun: it.amaun,
          bill_no: it.bill_no,
          status: BillingStatus.CREATED,
        }),
      ),
    });
    return this.billingRepo.save(billing);
  }

  // Handle Razer callback: update billing status and store PG details
  // (Razer-specific handler removed)

  // Prefer MBMB callback: update by orderid returned from payment/submit
  async handleMbmbCallback(dto: MbmbCallbackDto): Promise<Billing> {
    // Persist raw callback for audit/troubleshooting
    await this.paymentRepo.save(this.paymentRepo.create({
      orderid: dto.orderid,
      tranID: dto.tranID,
      domain: dto.domain,
      status: dto.status,
      amount: dto.amount,
      currency: dto.currency,
      paydate: dto.paydate,
      appcode: dto.appcode,
      error_code: dto.error_code,
      error_desc: dto.error_desc,
      channel: dto.channel,
      extraP: dto.extraP,
      treq: dto.treq,
      user_id: dto.user_id,
      vendor_id: dto.vendor_id,
      vendor_method: dto.vendor_method,
      callbackPaymentUrl: dto.callbackPaymentUrl,
      skey: dto.skey,
    }));
    const reference = dto.orderid;
    const billing = await this.billingRepo.findOne({ where: { reference }, relations: ['items', 'user'] });
    if (!billing) throw new NotFoundException('Billing not found');

    // Normalize status: treat 'Paid', 'N', '00', '1' as paid
    const s = (dto.status || '').toLowerCase();
    const paid = s === 'paid' || s === 'n' || s === '00' || s === '1';
    billing.paymentGatewayStatus = dto.status || null;
    billing.paidAmount = dto.amount ? Number(dto.amount) : billing.paidAmount ?? null;
    billing.paymentGatewayTransactionId = dto.tranID || billing.paymentGatewayTransactionId || null;
    billing.paymentGatewayRefNo = dto.refNo || billing.paymentGatewayRefNo || null;
    billing.paidAt = dto.paydate ? new Date(dto.paydate) : billing.paidAt ?? new Date();
    billing.status = paid ? BillingStatus.PAID : BillingStatus.UNPAID;

    billing.items?.forEach((it) => { it.status = billing.status; });
    await this.billingItemRepo.save(billing.items || []);
    await this.billingRepo.save(billing);

    // If payment is successful, insert online bill to MBMB
    if (paid && billing.items && billing.items.length > 0) {
      try {
        // Map all billing items to OnlineTransactionAcct array
        const insertPayload: InsertOnlineBillDto = {
          orderNo: reference,
          orderTime: (billing.paidAt || new Date()).toISOString(),
          orderBank: (dto.vendor_method || 'RazerPay').toUpperCase(), // MBMB expects uppercase
          orderAmount: Number(billing.paidAmount || billing.totalAmount),
          orderStatus: 'N', // N = Paid/Success in MBMB
          userId: String(billing.userId || '0'),
          ipAddress: '127.0.0.1', // Use default IP address, not extraP which contains token JSON
          buyerEmail: billing.user?.email || dto.domain || 'noreply@ixora.local',
          transactionResponseCode: dto.error_code || '00',
          transactionId: dto.tranID || undefined,
          transactionTime: dto.paydate || undefined,
          transactionBank: dto.channel || undefined,
          transactionRefNo: dto.appcode || undefined,
          transactionAmount: billing.paidAmount ? Number(billing.paidAmount) : undefined,
          onlineTransactionAcct: billing.items.map((item) => ({
            order_no: reference, // Use main billing reference, not individual item order_no
            jenis: item.jenis,
            no_akaun: item.no_akaun,
            amaun: Number(item.amaun),
          })),
        };
        await this.insertOnlineBill(insertPayload);
      } catch (insertErr: any) {
        // Log error but don't fail the callback
        console.error('[BillingService] Failed to insert online bill to MBMB:', insertErr?.message);
      }
    }

    return billing;
  }

  // Submit payment via MBMB and get redirect URL for Razer
  async submitPayment(dto: PaymentSubmitDto): Promise<{ status: boolean; url?: string }> {
    const resourcePath = process.env.MBMB_PAYMENT_SUBMIT_RESOURCE || 'payment/submit';
    // MBMB expects snake/camel casing as per their API. We'll map to their query/body keys.
    const payload = {
      orderid: dto.orderId, // IXORA reference
      amount: dto.amount,
      bill_name: dto.billName,
      bill_email: dto.billEmail,
      bill_mobile: dto.billMobile,
      bill_desc: dto.billDesc,
      country: dto.country || 'MY',
    };
    let res: any;
    try {
      res = await this.mbmb.postPublicResource(resourcePath, payload);
    } catch (e: any) {
      console.error('[BillingService] submitPayment -> MBMB error:', e?.message);
      throw e;
    }
    // Expected: { status: true, url: 'https://...' }
    return { status: !!res?.status, url: res?.url };
  }

  // Checkout multiple outstanding bills (not yet persisted) -> create Billing + items then submit payment
  async checkoutOutstanding(dto: CheckoutOutstandingDto): Promise<{ reference: string; url?: string }> {
    // Reject duplicate reference
    const existing = await this.billingRepo.findOne({ where: { reference: dto.reference } });
    if (existing) return { reference: dto.reference, url: undefined };

    // businessId optional: if provided validate, otherwise store null
    let businessId: number | null = null;
    if (dto.businessId) {
      const biz = await this.businessRepo.findOne({ where: { id: dto.businessId } });
      if (!biz) throw new NotFoundException('Business not found');
      businessId = biz.id;
    }

    // Validate item types (jenis) to prevent sending unknown codes like '99'
    const allowedJenis = new Set(['01', '02', '04', '05']);
    const invalid = dto.bills
      .map(b => b.item_type)
      .filter(j => !allowedJenis.has(j));
    if (invalid.length) {
      const uniq = Array.from(new Set(invalid));
      throw new BadRequestException({ error: 'InvalidItemType', message: `Unsupported item_type code(s): ${uniq.join(', ')}. Allowed: ${Array.from(allowedJenis).join(', ')}` });
    }
    const total = dto.bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const billing = this.billingRepo.create({
      reference: dto.reference,
      businessId: businessId ?? null,
      userId: dto.userId,
      status: BillingStatus.CREATED,
      totalAmount: total,
      currency: 'MYR',
      items: dto.bills.map((b, idx) => this.billingItemRepo.create({
        order_no: `${dto.reference}-${idx + 1}`,
        jenis: b.item_type,
        no_akaun: b.account_no,
        amaun: b.amount,
        bill_no: b.bill_no,
        status: BillingStatus.CREATED,
      })),
    });
    await this.billingRepo.save(billing);
    // Submit payment to obtain redirect URL
    const paymentRes = await this.submitPayment({
      orderId: dto.reference,
      amount: total,
      billName: dto.billName,
      billEmail: dto.billEmail,
      billMobile: dto.billMobile,
      billDesc: dto.billDesc,
      country: 'MY',
    });
    if (paymentRes?.url) {
      billing.mbmbSubmittedAt = new Date();
      await this.billingRepo.save(billing);
    }
    return { reference: dto.reference, url: paymentRes.url };
  }

  async findByReference(reference: string): Promise<any> {
    const billing = await this.billingRepo.findOne({ where: { reference }, relations: ['items'] });
    if (!billing) throw new NotFoundException('Billing not found');
    return {
      reference: billing.reference,
      status: billing.status,
      totalAmount: billing.totalAmount,
      currency: billing.currency,
      paidAmount: billing.paidAmount ?? null,
      paidAt: billing.paidAt ?? null,
      gatewayStatus: billing.paymentGatewayStatus ?? null,
      paymentGatewayTransactionId: billing.paymentGatewayTransactionId ?? null,
      items: (billing.items || []).map(it => ({
        id: it.id,
        order_no: it.order_no,
        item_type: it.jenis,
        account_no: it.no_akaun,
        bill_no: it.bill_no ?? null,
        amount: Number(it.amaun),
        status: it.status,
      })),
      submittedAt: billing.mbmbSubmittedAt ?? null,
      createdAt: billing.createdAt,
      updatedAt: billing.updatedAt,
    };
  }

  // Find billing items by external bill number (bill_no)
  async findItemsByBillNo(billNo: string): Promise<any[]> {
    const value = (billNo || '').trim();
    if (!value) throw new BadRequestException('bill_no is required');
    if (value.length > 128) throw new BadRequestException('bill_no too long');

    const items = await this.billingItemRepo.find({
      where: { bill_no: value },
      relations: ['billing'],
      order: { createdAt: 'DESC' },
    });

    return items.map((it) => ({
      id: it.id,
      reference: it.billing?.reference ?? null,
      billing_status: it.billing?.status ?? null,
      order_no: it.order_no,
      item_type: it.jenis,
      account_no: it.no_akaun,
      bill_no: it.bill_no ?? null,
      amount: Number(it.amaun),
      status: it.status,
      createdAt: it.createdAt,
      updatedAt: it.updatedAt,
    }));
  }
}
