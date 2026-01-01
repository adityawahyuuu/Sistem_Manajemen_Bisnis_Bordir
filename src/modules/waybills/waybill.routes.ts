import { Router } from 'express';
import { waybillController } from './controllers/waybill.controller';
import { validate, authMiddleware } from '../../middleware';
import { createWaybillSchema, updateWaybillSchema } from './validators/waybill.validator';

const router = Router();
router.use(authMiddleware);

router.get('/', waybillController.findAll);
router.get('/:id', waybillController.findById);
router.post('/', validate(createWaybillSchema), waybillController.create);
router.put('/:id', validate(updateWaybillSchema), waybillController.update);
router.delete('/:id', waybillController.delete);
router.post('/:id/generate', waybillController.generate);
router.get('/:id/download', waybillController.download);

export default router;
