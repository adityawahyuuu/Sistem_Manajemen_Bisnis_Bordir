import { Request, Response, NextFunction } from 'express';
import { masterService } from '../services/master.service';
import { sendSuccess } from '../../../shared/utils/response.util';

export const masterController = {
  async getProvinces(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const data = await masterService.findAllProvinces(search);
      sendSuccess(res, data, 'Provinces retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCities(req: Request, res: Response, next: NextFunction) {
    try {
      const province_code = req.query.province_code as string | undefined;
      const search = req.query.search as string | undefined;

      if (!province_code) {
        return sendSuccess(res, [], 'Cities retrieved successfully');
      }

      const data = await masterService.findCitiesByProvince(province_code, search);
      sendSuccess(res, data, 'Cities retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getSubdistricts(req: Request, res: Response, next: NextFunction) {
    try {
      const city_code = req.query.city_code as string | undefined;
      const search = req.query.search as string | undefined;

      if (!city_code) {
        return sendSuccess(res, [], 'Subdistricts retrieved successfully');
      }

      const data = await masterService.findSubdistrictsByCity(city_code, search);
      sendSuccess(res, data, 'Subdistricts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getVillages(req: Request, res: Response, next: NextFunction) {
    try {
      const subdistrict_code = req.query.subdistrict_code as string | undefined;
      const search = req.query.search as string | undefined;

      if (!subdistrict_code) {
        return sendSuccess(res, [], 'Villages retrieved successfully');
      }

      const data = await masterService.findVillagesBySubdistrict(subdistrict_code, search);
      sendSuccess(res, data, 'Villages retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getVillageById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const village = await masterService.findVillageById(id);
      sendSuccess(res, village, 'Village retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
