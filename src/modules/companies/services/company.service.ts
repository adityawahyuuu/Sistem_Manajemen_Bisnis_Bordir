import { prisma } from '../../../config/prisma';
import { AppError } from '../../../middleware/error.middleware';

export const companyService = {
  async getAllCompanies(userId: number) {
    return await prisma.companies.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  },

  async getCompanyById(companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    return company;
  },

  async createCompany(userId: number, data: {
    name: string;
    domain?: string;
    address?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
  }) {
    return await prisma.companies.create({
      data: {
        user_id: userId,
        name: data.name,
        domain: data.domain,
        address: data.address,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
        phone: data.phone,
        email: data.email,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  async updateCompany(
    companyId: number,
    userId: number,
    data: {
      name?: string;
      domain?: string;
      address?: string;
      city?: string;
      province?: string;
      postal_code?: string;
      phone?: string;
      email?: string;
      is_active?: boolean;
    }
  ) {
    // Check ownership
    await this.getCompanyById(companyId, userId);

    return await prisma.companies.update({
      where: { id: companyId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  },

  async deleteCompany(companyId: number, userId: number) {
    // Check ownership
    await this.getCompanyById(companyId, userId);

    // Soft delete
    return await prisma.companies.update({
      where: { id: companyId },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },
};
