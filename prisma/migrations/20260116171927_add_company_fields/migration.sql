/*
  Warnings:

  - Added the required column `name` to the `companies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `companies` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `city` VARCHAR(100) NULL,
    ADD COLUMN `email` VARCHAR(255) NULL,
    ADD COLUMN `name` VARCHAR(255) NOT NULL,
    ADD COLUMN `phone` VARCHAR(50) NULL,
    ADD COLUMN `postal_code` VARCHAR(20) NULL,
    ADD COLUMN `province` VARCHAR(100) NULL;
