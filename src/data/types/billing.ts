export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  treatmentId: string | null;
  description: string;
  cdtCode: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  clinicId: string;
  patientId: string;
  invoiceNumber: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  /**
   * Denormalized onto the invoice rather than a separate joined
   * collection — every real read of an invoice wants its line items
   * hydrated, and this is a mock/offline read-heavy layer with no join
   * cost to avoid paying for.
   */
  lineItems: InvoiceLineItem[];
}

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'check' | 'insurance' | 'other';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentRefund {
  id: string;
  paymentId: string;
  refundAmount: number;
  reason: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt: string | null;
}

export interface Payment {
  id: string;
  clinicId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // YYYY-MM-DD
  processor: string | null;
  transactionId: string | null;
  status: PaymentStatus;
  notes: string | null;
  createdAt: string;
  /** Embedded rather than a separate collection — only one refund exists in the whole dataset. */
  refund: PaymentRefund | null;
}
