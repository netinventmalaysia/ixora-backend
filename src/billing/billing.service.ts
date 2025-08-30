import { Injectable } from '@nestjs/common';
import { InvoiceDto } from './dto/invoice.dto';
import { format } from 'date-fns';

@Injectable()
export class BillingService {
  // TODO: Replace with real source (DB or MBMB API) later
  async listInvoices(businessId?: number): Promise<InvoiceDto[]> {
    // Stubbed example data; return empty array when businessId provided but no data
    const now = new Date('2024-12-13T00:00:00Z');

    const items: InvoiceDto[] = [
      {
        id: 1,
        name: 'Booth Rental',
        business_id: 101,
        lastInvoice: {
          id: 9001,
          date: format(now, 'MMMM d, yyyy'), // e.g., "December 13, 2024"
          dateTime: now.toISOString(),
          amount: 'RM 2,000.00',
          status: 'Paid',
        },
        dueDate: undefined,
        outstandingAmount: 0,
        currency: 'MYR',
      },
      {
        id: 2,
        name: 'MySKB (Company)',
        business_id: 102,
        lastInvoice: {
          id: 9002,
          date: format(now, 'MMMM d, yyyy'),
          dateTime: now.toISOString(),
          amount: 'RM 150.00',
          status: 'Overdue',
        },
        dueDate: undefined,
        outstandingAmount: 150,
        currency: 'MYR',
        customer_ic: '901231-10-1234',
      },
    ];

    if (typeof businessId === 'number') {
      return items.filter(i => i.business_id === businessId);
    }
    return items;
  }
}
