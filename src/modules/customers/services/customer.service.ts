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
        include: {
          invoices: {
            where: {},
            select: { total_amount: true, total_paid: true },
          },
        },
      }),
      prisma.customers.count({ where }),
    ]);

    const data = customers.map(({ invoices, ...c }) => ({
      ...c,
      piutang: invoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.total_amount) - Number(inv.total_paid)), 0),
      overpay: invoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.total_paid) - Number(inv.total_amount)), 0),
    }));

    return { data, total };
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
          include: { items: true },
        },
        invoices: {
          select: { total_amount: true, total_paid: true },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const { invoices, ...rest } = customer;
    return {
      ...rest,
      piutang: invoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.total_amount) - Number(inv.total_paid)), 0),
      overpay: invoices.reduce((sum, inv) => sum + Math.max(0, Number(inv.total_paid) - Number(inv.total_amount)), 0),
    };
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
        mobile_phone: data.mobile_phone,
        address: data.address,
        province_code: data.province_code,
        city_code: data.city_code,
        subdistrict_code: data.subdistrict_code,
        village_code: data.village_code,
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
        mobile_phone: data.mobile_phone,
        address: data.address,
        province_code: data.province_code,
        city_code: data.city_code,
        subdistrict_code: data.subdistrict_code,
        village_code: data.village_code,
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
