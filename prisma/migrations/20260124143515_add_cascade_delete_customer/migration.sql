-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `fk_invoices_customer_id`;

-- DropForeignKey
ALTER TABLE `receipts` DROP FOREIGN KEY `fk_receipts_customer_id`;

-- DropForeignKey
ALTER TABLE `waybills` DROP FOREIGN KEY `fk_waybills_customer_id`;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `fk_invoices_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `receipts` ADD CONSTRAINT `fk_receipts_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `waybills` ADD CONSTRAINT `fk_waybills_customer_id` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
