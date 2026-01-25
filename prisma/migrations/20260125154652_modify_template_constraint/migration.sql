/*
  Warnings:

  - A unique constraint covering the columns `[company_id,document_type,deleted_at]` on the table `document_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `unique_template_type_per_company` ON `document_templates`;

-- CreateIndex
CREATE UNIQUE INDEX `unique_template_type_per_company_active` ON `document_templates`(`company_id`, `document_type`, `deleted_at`);