import { Request, Response, NextFunction } from 'express';
import { templatePhotoService } from '../services/template-photo.service';
import {
  sendSuccess,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';
import { AppError } from '../../../middleware';

export const templatePhotoController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const photos = await templatePhotoService.findAllByCompany(companyId, userId);

      sendSuccessWithDates(res, photos, 'Template photos retrieved');
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const photo = await templatePhotoService.findById(id, companyId, userId);

      sendSuccessWithDates(res, photo, 'Template photo retrieved');
    } catch (error) {
      next(error);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const photo = await templatePhotoService.upload(companyId, userId, req.file);

      sendCreatedWithDates(res, photo, 'Photo uploaded successfully');
    } catch (error) {
      next(error);
    }
  },

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const photos = await Promise.all(
        req.files.map((file) => templatePhotoService.upload(companyId, userId, file))
      );

      sendCreatedWithDates(res, photos, `${photos.length} photos uploaded successfully`);
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      await templatePhotoService.delete(id, companyId, userId);

      sendSuccess(res, null, 'Photo deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
