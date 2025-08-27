// Minimal DTO that matches the frontend's current consumption
export interface InvoiceDto {
  id: number;
  name: string;
  business_id: number;
  lastInvoice: {
    id?: number;
    date: string;     // human readable date, e.g., "December 13, 2024"
    dateTime: string; // ISO string
    amount: string;   // formatted currency, e.g., "RM 2,000.00"
    status: string;   // e.g., "Overdue", "Paid", "Pending"
  };
  // Optional helpful fields
  dueDate?: string;          // ISO
  outstandingAmount?: number; // numeric amount
  currency?: string;         // e.g., "MYR"
  customer_ic?: string;      // if applicable
}
