export interface Customer {
  id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  whatsapp_numbers: string[];
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCustomerDto {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  whatsapp_numbers?: string[];
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
