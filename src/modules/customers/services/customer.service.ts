import { prisma } from '../../../database/prisma.client';
import { CreateCustomerDto, UpdateCustomerDto } from '../interfaces/customer.interface';
import { AppError } from '../../../middleware';

export const customerService = {
  async findAll(companyId: number, userId: number, page = 1, limit = 10, search?: string) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const where = {
      company_id: companyId,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { company_name: { contains: search } },
          { email: { contains: search } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.customers.count({ where }),
    ]);

    return { data: customers, total };
  },

  async findById(id: number, companyId: number, userId: number) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const customer = await prisma.customers.findFirst({
      where: { id, company_id: companyId },
      include: {
        customer_items: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  },

  async create(companyId: number, userId: number, data: CreateCustomerDto) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const customer = await prisma.customers.create({
      data: {
        company_id: companyId,
        name: data.name,
        company_name: data.company_name,
        email: data.email,
        phone: data.phone,
        whatsapp_numbers: data.whatsapp_numbers || [],
        address: data.address,
        city: data.city || 'Tasikmalaya',
        province: data.province || 'Jawa Barat',
        postal_code: data.postal_code,
      },
    });

    return customer;
  },

  async update(id: number, companyId: number, userId: number, data: UpdateCustomerDto) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    // Verify customer belongs to company
    const existingCustomer = await prisma.customers.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existingCustomer) {
      throw new AppError('Customer not found', 404);
    }

    const customer = await prisma.customers.update({
      where: { id },
      data: {
        name: data.name,
        company_name: data.company_name,
        email: data.email,
        phone: data.phone,
        whatsapp_numbers: data.whatsapp_numbers,
        address: data.address,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
      },
    });

    return customer;
  },

  async delete(id: number, companyId: number, userId: number) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    // Verify customer belongs to company
    const existingCustomer = await prisma.customers.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existingCustomer) {
      throw new AppError('Customer not found', 404);
    }

    await prisma.customers.delete({ where: { id } });

    return true;
  },
};
