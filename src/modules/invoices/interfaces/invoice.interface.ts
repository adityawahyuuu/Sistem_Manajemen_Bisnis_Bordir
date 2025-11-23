export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date?: Date | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  notes?: string | null;
  generated_file_path?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_price: number;
  created_at: Date;
}

export interface CreateInvoiceDto {
  customer_id: string;
  invoice_date?: string;
  due_date?: string;
  tax_amount?: number;
  discount_amount?: number;
  notes?: string;
  items: CreateInvoiceItemDto[];
}

export interface CreateInvoiceItemDto {
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
  status?: string;
}
