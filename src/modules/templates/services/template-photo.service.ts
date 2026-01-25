import { prisma } from '../../../database/prisma.client';
import { AppError } from '../../../middleware';
import { deleteFile, getFileUrl } from '../../../shared/utils/upload.util';
import { storageConfig } from '../../../config/app.config';
import path from 'path';

export const templatePhotoService = {
  async verifyCompanyAccess(companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    return company;
  },

  async findAllByCompany(companyId: number, userId: number) {
    await this.verifyCompanyAccess(companyId, userId);

    return prisma.template_photos.findMany({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });
  },

  async findById(id: number, companyId: number, userId: number) {
    await this.verifyCompanyAccess(companyId, userId);

    const photo = await prisma.template_photos.findFirst({
      where: {
        id,
        company_id: companyId,
        deleted_at: null,
      },
    });

    if (!photo) {
      throw new AppError('Photo not found', 404);
    }

    return photo;
  },

  async upload(
    companyId: number,
    userId: number,
    file: Express.Multer.File
  ) {
    await this.verifyCompanyAccess(companyId, userId);

    const fileUrl = getFileUrl(file.filename, 'template-photo');

    return prisma.template_photos.create({
      data: {
        company_id: companyId,
        filename: file.filename,
        original_name: file.originalname,
        file_path: file.path,
        file_url: fileUrl,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_by: userId,
      },
    });
  },

  async delete(id: number, companyId: number, userId: number) {
    const photo = await this.findById(id, companyId, userId);

    // Delete physical file
    const filePath = path.join(storageConfig.templatePhotosPath, photo.filename);
    await deleteFile(filePath).catch(() => {});

    // Soft delete record
    return prisma.template_photos.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  },

  async deleteHard(id: number, companyId: number, userId: number) {
    const photo = await this.findById(id, companyId, userId);

    // Delete physical file
    const filePath = path.join(storageConfig.templatePhotosPath, photo.filename);
    await deleteFile(filePath).catch(() => {});

    // Hard delete record
    return prisma.template_photos.delete({
      where: { id },
    });
  },
};
