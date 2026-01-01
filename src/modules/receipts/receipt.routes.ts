import { Router } from 'express';
import { receiptController } from './controllers/receipt.controller';
import { validate, authMiddleware } from '../../middleware';
import Joi from 'joi';

const router = Router();
router.use(authMiddleware);

const createReceiptSchema = Joi.object({
  invoice_id: Joi.string(),
  customer_id: Joi.string().required(),
  receipt_date: Joi.date().iso(),
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().valid('cash', 'transfer', 'check').default('cash'),
  description: Joi.string().allow('', null),
  received_by: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

const updateReceiptSchema = Joi.object({
  amount: Joi.number().min(0),
  payment_method: Joi.string().valid('cash', 'transfer', 'check'),
  description: Joi.string().allow('', null),
  received_by: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

router.get('/', receiptController.findAll);
router.get('/:id', receiptController.findById);
router.post('/', validate(createReceiptSchema), receiptController.create);
router.put('/:id', validate(updateReceiptSchema), receiptController.update);
router.delete('/:id', receiptController.delete);
router.post('/:id/generate', receiptController.generate);
router.get('/:id/download', receiptController.download);

export default router;
