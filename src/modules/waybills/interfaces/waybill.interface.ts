import { waybills_status } from '../../../../prisma/generated/prisma';

export interface Waybill {
  id: number;
  company_id: number;
  invoice_id?: number | null;
  customer_id: number;
  waybill_number: string;
  waybill_date: Date;
  destination_address?: string | null;
  destination_city?: string | null;
  destination_province?: string | null;
  vehicle_number?: string | null;
  driver_name?: string | null;
  notes?: string | null;
  status: waybills_status;
  generated_file_path?: string | null;
  created_by: number;
  created_at?: Date | null;
  updated_at?: Date | null;
}

export interface WaybillItem {
  id: number;
  waybill_id: number;
  item_name: string;
  quantity: number;
  unit?: string | null;
  notes?: string | null;
  created_at?: Date | null;
}

export interface CreateWaybillDto {
  company_id: number;
  invoice_id?: number;
  customer_id: number;
  waybill_date?: string;
  destination_address?: string;
  destination_city?: string;
  destination_province?: string;
  vehicle_number?: string;
  driver_name?: string;
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
  status?: waybills_status;
}

export interface WaybillQueryParams {
  page?: number;
  limit?: number;
  customer_id?: number;
  invoice_id?: number;
  status?: waybills_status;
  search?: string;
}
