import { receipts_payment_method } from '../../../../prisma/generated/prisma';

export interface Receipt {
  id: number;
  company_id: number;
  invoice_id?: number | null;
  customer_id: number;
  receipt_number: string;
  receipt_date: Date;
  amount: number;
  payment_method: receipts_payment_method;
  description?: string | null;
  received_by?: string | null;
  notes?: string | null;
  generated_file_path?: string | null;
  created_by: number;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface CreateReceiptDto {
  company_id: number;
  invoice_id?: number;
  customer_id: number;
  receipt_date?: string;
  amount: number;
  payment_method?: receipts_payment_method;
  description?: string;
  received_by?: string;
  notes?: string;
}

export interface UpdateReceiptDto {
  amount?: number;
  payment_method?: receipts_payment_method;
  description?: string;
  received_by?: string;
  notes?: string;
}

export interface ReceiptQueryParams {
  page?: number;
  limit?: number;
  customer_id?: number;
  invoice_id?: number;
  payment_method?: receipts_payment_method;
  search?: string;
}
