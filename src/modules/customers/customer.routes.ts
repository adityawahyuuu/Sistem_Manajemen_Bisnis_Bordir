import { Router } from 'express';
import { customerController } from './controllers/customer.controller';
import { validate, authMiddleware } from '../../middleware';
import { createCustomerSchema, updateCustomerSchema } from './validators/customer.validator';

const router = Router();

router.use(authMiddleware);

router.get('/', customerController.findAll);
router.get('/:id', customerController.findById);
router.post('/', validate(createCustomerSchema), customerController.create);
router.put('/:id', validate(updateCustomerSchema), customerController.update);
router.delete('/:id', customerController.delete);

export default router;
