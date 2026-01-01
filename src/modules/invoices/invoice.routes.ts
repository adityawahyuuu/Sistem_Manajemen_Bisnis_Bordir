import { Router } from 'express';
import { invoiceController } from './controllers/invoice.controller';
import { validate, authMiddleware } from '../../middleware';
import { createInvoiceSchema, updateInvoiceSchema } from './validators/invoice.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', invoiceController.findAll);
router.get('/:id', invoiceController.findById);
router.post('/', validate(createInvoiceSchema), invoiceController.create);
router.put('/:id', validate(updateInvoiceSchema), invoiceController.update);
router.delete('/:id', invoiceController.delete);
router.post('/:id/generate', invoiceController.generate);
router.get('/:id/download', invoiceController.download);

export default router;
