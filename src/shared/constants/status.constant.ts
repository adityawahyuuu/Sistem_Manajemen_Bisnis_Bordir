export const INVOICE_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const;

export const WAYBILL_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  SENT: 'sent',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const RECEIPT_STATUS = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  SENT: 'sent',
} as const;

export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

export const DOCUMENT_TYPE = {
  INVOICE: 'invoice',
  WAYBILL: 'waybill',
  RECEIPT: 'receipt',
} as const;

export const PAYMENT_METHOD = {
  CASH: 'cash',
  TRANSFER: 'transfer',
  CHECK: 'check',
} as const;
