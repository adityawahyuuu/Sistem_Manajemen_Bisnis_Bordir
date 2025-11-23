export interface Receipt {
  id: string;
  invoice_id?: string | null;
  customer_id: string;
  receipt_number: string;
  receipt_date: Date;
  amount: number;
  payment_method: string;
  description?: string | null;
  received_by?: string | null;
  notes?: string | null;
  generated_file_path?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReceiptDto {
  invoice_id?: string;
  customer_id: string;
  receipt_date?: string;
  amount: number;
  payment_method?: string;
  description?: string;
  received_by?: string;
  notes?: string;
}

export interface UpdateReceiptDto {
  amount?: number;
  payment_method?: string;
  description?: string;
  received_by?: string;
  notes?: string;
}
