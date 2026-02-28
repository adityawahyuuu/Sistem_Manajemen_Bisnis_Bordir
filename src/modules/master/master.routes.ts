import { Router } from 'express';
import { masterController } from './controllers/master.controller';
import { authMiddleware } from '../../middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Master Data
 *   description: Master data wilayah (provinsi, kota, kecamatan, kelurahan)
 */

/**
 * @swagger
 * /master/provinces:
 *   get:
 *     summary: Get all provinces
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by province name
 *     responses:
 *       200:
 *         description: List of provinces
 */
router.get('/provinces', masterController.getProvinces);

/**
 * @swagger
 * /master/cities:
 *   get:
 *     summary: Get cities by province
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Province code
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by city name
 *     responses:
 *       200:
 *         description: List of cities
 */
router.get('/cities', masterController.getCities);

/**
 * @swagger
 * /master/subdistricts:
 *   get:
 *     summary: Get subdistricts by city
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city_code
 *         required: true
 *         schema:
 *           type: string
 *         description: City code
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by subdistrict name
 *     responses:
 *       200:
 *         description: List of subdistricts
 */
router.get('/subdistricts', masterController.getSubdistricts);

/**
 * @swagger
 * /master/villages:
 *   get:
 *     summary: Get villages by subdistrict
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subdistrict_code
 *         required: true
 *         schema:
 *           type: string
 *         description: Subdistrict code
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by village name
 *     responses:
 *       200:
 *         description: List of villages
 */
router.get('/villages', masterController.getVillages);

/**
 * @swagger
 * /master/villages/{id}:
 *   get:
 *     summary: Get village by ID (includes postal_code)
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Village detail
 *       404:
 *         description: Village not found
 */
router.get('/villages/:id', masterController.getVillageById);


export default router;
