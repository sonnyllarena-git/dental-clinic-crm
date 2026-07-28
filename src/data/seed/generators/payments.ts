import type { SeededRandom } from '../prng';
import type { Invoice, Payment, PaymentMethod } from '@/data/types';
import { addMinutes, toIsoDate, toIsoDateTime } from '../referenceDate';
import type { BillingHints } from './invoices';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'credit_card', 'debit_card', 'check', 'insurance', 'other'];
const NON_INSURANCE_METHODS = PAYMENT_METHODS.filter((m) => m !== 'insurance');

export function generatePayments(
  rng: SeededRandom,
  clinicId: string,
  invoices: Invoice[],
  hints: BillingHints,
): Payment[] {
  const payments: Payment[] = [];

  const makePayment = (invoice: Invoice, amount: number, method: PaymentMethod, daysAfterInvoice: number): Payment => {
    const paymentDate = toIsoDate(addMinutes(new Date(`${invoice.invoiceDate}T00:00:00Z`), daysAfterInvoice * 24 * 60));
    const isCard = method === 'credit_card' || method === 'debit_card';
    const payment: Payment = {
      id: rng.id('pay'),
      clinicId,
      invoiceId: invoice.id,
      patientId: invoice.patientId,
      amount,
      paymentMethod: method,
      paymentDate,
      processor: isCard ? 'stripe' : null,
      transactionId: isCard ? `TXN-${rng.int(100_000, 999_999)}` : null,
      status: 'completed',
      notes: null,
      createdAt: toIsoDateTime(addMinutes(new Date(`${paymentDate}T00:00:00Z`), rng.int(60, 300))),
      refund: null,
    };
    payments.push(payment);
    return payment;
  };

  invoices.forEach((invoice) => {
    if (invoice.id === hints.mixedPaymentInvoiceId) {
      const insuranceAmount = Math.round(invoice.totalAmount * 0.6);
      const cardAmount = invoice.totalAmount - insuranceAmount;
      makePayment(invoice, insuranceAmount, 'insurance', rng.int(2, 10));
      makePayment(invoice, cardAmount, 'credit_card', rng.int(11, 20));
      return;
    }

    if (invoice.id === hints.twoPaymentPartialInvoiceId) {
      const first = Math.round(invoice.amountPaid * 0.6);
      const second = invoice.amountPaid - first;
      makePayment(invoice, first, 'cash', rng.int(1, 5));
      makePayment(invoice, second, 'debit_card', rng.int(6, 15));
      return;
    }

    if (invoice.id === hints.refundInvoiceId) {
      const payment = makePayment(invoice, invoice.amountPaid, rng.pick(NON_INSURANCE_METHODS), rng.int(1, 5));
      const refundAmount = Math.round(payment.amount * 0.3);
      payment.refund = {
        id: rng.id('refund'),
        paymentId: payment.id,
        refundAmount,
        reason: 'Patient was overbilled after insurance retroactively covered part of the procedure.',
        status: 'completed',
        createdAt: toIsoDateTime(addMinutes(new Date(`${payment.paymentDate}T00:00:00Z`), rng.int(60 * 24, 60 * 24 * 10))),
        completedAt: toIsoDateTime(addMinutes(new Date(`${payment.paymentDate}T00:00:00Z`), rng.int(60 * 24 * 2, 60 * 24 * 15))),
      };
      return;
    }

    if (invoice.amountPaid > 0) {
      makePayment(invoice, invoice.amountPaid, rng.pick(PAYMENT_METHODS), rng.int(1, 20));
    }
  });

  return payments;
}
