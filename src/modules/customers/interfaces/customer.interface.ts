export interface Customer {
  id: number;
  company_id: number;
  name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile_phone?: string | null;
  address?: string | null;
  province_code?: string | null;
  city_code?: string | null;
  subdistrict_code?: string | null;
  village_code?: string | null;
  postal_code?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface CreateCustomerDto {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  address?: string;
  province_code?: string;
  city_code?: string;
  subdistrict_code?: string;
  village_code?: string;
  postal_code?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
