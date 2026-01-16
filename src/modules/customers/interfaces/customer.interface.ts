export interface Customer {
  id: number;
  company_id: number;
  name: string;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp_numbers: any; // JSON type in Prisma
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
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
