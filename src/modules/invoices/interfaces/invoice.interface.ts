import { invoices_status, invoices_payment_status, receipts_payment_method, invoice_items_discount_type } from '../../../../prisma/generated/prisma';

export interface Invoice {
  id: number;
  company_id: number;
  customer_id: number;
  invoice_number: string;
  invoice_date: Date;
  due_date?: Date | null;
  po_number?: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_cost: number;
  total_amount: number;
  status: invoices_status;
  notes?: string | null;
  generated_file_path?: string | null;
  created_by: number;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  item_id: number;
  item_name: string;
  description?: string | null;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  discount_type: invoice_items_discount_type;
  discount_amount: number;
  total_price: number;
  created_at?: Date | null;
}

export interface CreateInvoiceDto {
  company_id: number;
  customer_id: number;
  invoice_date?: string;
  due_date?: string;
  po_number?: string;
  tax_amount?: number;
  discount_amount?: number;
  shipping_cost?: number;
  notes?: string;
  items: CreateInvoiceItemDto[];
}

export interface CreateInvoiceItemDto {
  item_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_type?: invoice_items_discount_type;
  discount_amount?: number;
}

export interface UpdateInvoiceDto {
  due_date?: string;
  po_number?: string;
  tax_amount?: number;
  discount_amount?: number;
  shipping_cost?: number;
  notes?: string;
  status?: invoices_status;
  items?: CreateInvoiceItemDto[];
}

export interface CreatePaymentDto {
  payment_date: string;
  amount: number;
  payment_method: receipts_payment_method;
  notes?: string;
}

export interface UpdatePaymentDto {
  payment_date?: string;
  amount?: number;
  payment_method?: receipts_payment_method;
  notes?: string;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  company_id: number;
  payment_date: Date;
  amount: number;
  payment_method: receipts_payment_method;
  notes?: string | null;
  created_by: number;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
  receipts?: PaymentHistoryItem[];
  total_paid?: number;
  payment_status?: 'lunas' | 'dp' | 'belum_bayar';
  customers?: {
    id: number;
    name: string;
    company_name?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
  };
  companies?: {
    id: number;
    name: string;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    phone?: string | null;
    email?: string | null;
  };
}

export interface PaymentHistoryItem {
  id: number;
  receipt_number: string;
  receipt_date: Date;
  amount: number;
  payment_method: string;
  status: string;
  notes?: string | null;
}

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: invoices_status;
  customer_id?: number;
  search?: string;
}
