import Router from 'express';
import authRoutes from '../modules/auth/auth.routes';
import companyRoutes from '../modules/companies/companies.routes';
import customerRoutes from '../modules/customers/customer.routes';
import itemRoutes from '../modules/items/items.routes';
import invoiceRoutes from '../modules/invoices/invoice.routes';
import waybillRoutes from '../modules/waybills/waybill.routes';
import receiptRoutes from '../modules/receipts/receipt.routes';
import masterRoutes from '../modules/master/master.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/customers', customerRoutes);
router.use('/items', itemRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/waybills', waybillRoutes);
router.use('/receipts', receiptRoutes);
router.use('/master', masterRoutes);

export default router;
