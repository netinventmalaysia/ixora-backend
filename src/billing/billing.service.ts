import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvoiceDto } from './dto/invoice.dto';
import { Business } from '../business/registration/business.entity';
import { MbmbService } from '../mbmb/mbmb.service';
import { format } from 'date-fns';
import { InsertOnlineBillDto } from './dto/insert-online-bill.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    private readonly mbmb: MbmbService,
  ) {}

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
      OnlineTransactionAcct: {
        orderNo: body.onlineTransactionAcct.orderNo,
        jenis: body.onlineTransactionAcct.jenis,
        no_akaun: body.onlineTransactionAcct.no_akaun,
        amaun: body.onlineTransactionAcct.amaun,
      },
    };

    const resourcePath = process.env.MBMB_INSERT_RESOURCE || 'bill/online/insert';
    return this.mbmb.postPublicResource(resourcePath, payload);
  }
}
