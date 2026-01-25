import { prisma } from '../../../config/prisma';
import { AppError } from '../../../middleware/error.middleware';
import { deleteFile, getFileUrl } from '../../../shared/utils/upload.util';
import { storageConfig } from '../../../config/app.config';
import path from 'path';

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

  async uploadLogo(
    companyId: number,
    userId: number,
    file: Express.Multer.File
  ) {
    const company = await this.getCompanyById(companyId, userId);

    // Delete old logo if exists
    if (company.logo_url) {
      const oldFilename = company.logo_url.split('/').pop();
      if (oldFilename) {
        const oldFilePath = path.join(storageConfig.companyLogosPath, oldFilename);
        await deleteFile(oldFilePath).catch(() => {});
      }
    }

    const fileUrl = getFileUrl(file.filename, 'logo');

    return await prisma.companies.update({
      where: { id: companyId },
      data: {
        logo_url: fileUrl,
        updated_at: new Date(),
      },
    });
  },

  async getLogoPublicUrl(
    companyId: number,
    userId: number
  ): Promise<string | null> {
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        user_id: userId,
        deleted_at: null,
      },
      select: {
        logo_url: true,
      },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    if (!company.logo_url) {
      return null;
    }

    const baseUrl = process.env.APP_URL; // contoh: https://api.domain.com

    return `${baseUrl}${company.logo_url}`;
  },

  async deleteLogo(companyId: number, userId: number) {
    const company = await this.getCompanyById(companyId, userId);

    if (!company.logo_url) {
      throw new AppError('Company does not have a logo', 404);
    }

    const filename = company.logo_url.split('/').pop();
    if (filename) {
      const filePath = path.join(storageConfig.companyLogosPath, filename);
      await deleteFile(filePath).catch(() => {});
    }

    return await prisma.companies.update({
      where: { id: companyId },
      data: {
        logo_url: null,
        updated_at: new Date(),
      },
    });
  },
};
