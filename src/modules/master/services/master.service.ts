import { prisma } from '../../../database/prisma.client';
import { AppError } from '../../../middleware';

export const masterService = {
  async findAllProvinces(search?: string) {
    return prisma.provinces.findMany({
      where: search
        ? { name: { contains: search } }
        : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true },
    });
  },

  async findCitiesByProvince(province_code: string, search?: string) {
    return prisma.cities.findMany({
      where: {
        province_code,
        ...(search ? { name: { contains: search } } : {}),
      },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, province_code: true },
    });
  },

  async findSubdistrictsByCity(city_code: string, search?: string) {
    return prisma.subdistricts.findMany({
      where: {
        city_code,
        ...(search ? { name: { contains: search } } : {}),
      },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, city_code: true },
    });
  },

  async findVillagesBySubdistrict(subdistrict_code: string, search?: string) {
    return prisma.villages.findMany({
      where: {
        subdistrict_code,
        ...(search ? { name: { contains: search } } : {}),
      },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, postal_code: true, subdistrict_code: true },
    });
  },

  async findVillageById(id: number) {
    const village = await prisma.villages.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, postal_code: true, subdistrict_code: true },
    });

    if (!village) throw new AppError('Village not found', 404);

    return village;
  },
};
