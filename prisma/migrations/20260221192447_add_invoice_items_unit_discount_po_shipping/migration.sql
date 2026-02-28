-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `discount_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN `unit` VARCHAR(50) NULL DEFAULT 'pcs';

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `po_number` VARCHAR(100) NULL,
    ADD COLUMN `shipping_cost` DECIMAL(15, 2) NOT NULL DEFAULT 0.00;
