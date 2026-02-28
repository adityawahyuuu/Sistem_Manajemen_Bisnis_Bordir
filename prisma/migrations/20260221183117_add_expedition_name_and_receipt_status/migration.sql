-- AlterTable
ALTER TABLE `receipts` ADD COLUMN `status` ENUM('lunas', 'dp', 'piutang') NOT NULL DEFAULT 'dp';

-- AlterTable
ALTER TABLE `waybills` ADD COLUMN `expedition_name` VARCHAR(255) NULL;
