-- AddForeignKey
ALTER TABLE `document_templates` ADD CONSTRAINT `fk_templates_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
