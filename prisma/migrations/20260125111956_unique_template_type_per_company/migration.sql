/*
  Warnings:

  - A unique constraint covering the columns `[company_id,document_type]` on the table `document_templates` will be added. If there are existing duplicate values, this will fail.
*/

-- DropForeignKey
ALTER TABLE `document_templates` DROP FOREIGN KEY `fk_templates_company`;

-- DropIndex
DROP INDEX `unique_template_name_per_company` ON `document_templates`;

-- CreateIndex
CREATE UNIQUE INDEX `unique_template_type_per_company`
ON `document_templates`(`company_id`, `document_type`);
