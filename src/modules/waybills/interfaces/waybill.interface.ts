export interface Waybill {
  id: string;
  invoice_id?: string | null;
  customer_id: string;
  waybill_number: string;
  waybill_date: Date;
  destination_address?: string | null;
  destination_city?: string | null;
  destination_province?: string | null;
  vehicle_number?: string | null;
  driver_name?: string | null;
  notes?: string | null;
  status: string;
  generated_file_path?: string | null;
  created_by?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WaybillItem {
  id: string;
  waybill_id: string;
  item_name: string;
  quantity: number;
  unit?: string;
  notes?: string;
  created_at: Date;
}

export interface CreateWaybillDto {
  invoice_id: string;
  customer_id?: string;
  waybill_date?: string;
  destination_address?: string;
  destination_city?: string;
  destination_province?: string;
  vehicle_number?: string;
  driver_name?: string;
  driver_phone?: string;
  notes?: string;
  items?: CreateWaybillItemDto[];
}

export interface CreateWaybillItemDto {
  name: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface UpdateWaybillDto {
  destination_address?: string;
  destination_city?: string;
  destination_province?: string;
  vehicle_number?: string;
  driver_name?: string;
  notes?: string;
  status?: string;
}
