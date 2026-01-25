import { invoices_status } from '../../../../prisma/generated/prisma';

export interface Invoice {
  id: number;
  company_id: number;
  customer_id: number;
  invoice_number: string;
  invoice_date: Date;
  due_date?: Date | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
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
  item_name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at?: Date | null;
}

export interface CreateInvoiceDto {
  company_id: number;
  customer_id: number;
  invoice_date?: string;
  due_date?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  items: CreateInvoiceItemDto[];
}

export interface CreateInvoiceItemDto {
  item_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  unit?: string;
}

export interface UpdateInvoiceDto {
  due_date?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  status?: invoices_status;
  items?: CreateInvoiceItemDto[];
}

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
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

export interface InvoiceQueryParams {
  page?: number;
  limit?: number;
  status?: invoices_status;
  customer_id?: number;
  search?: string;
}
