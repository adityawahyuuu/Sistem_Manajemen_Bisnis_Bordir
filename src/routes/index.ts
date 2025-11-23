import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import customerRoutes from '../modules/customers/customer.routes';
import invoiceRoutes from '../modules/invoices/invoice.routes';
import waybillRoutes from '../modules/waybills/waybill.routes';
import receiptRoutes from '../modules/receipts/receipt.routes';
import whatsappRoutes from '../modules/whatsapp/whatsapp.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/waybills', waybillRoutes);
router.use('/receipts', receiptRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
