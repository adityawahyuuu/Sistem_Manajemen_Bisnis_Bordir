-- CreateTable
CREATE TABLE `document_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `document_type` ENUM('invoice', 'receipt', 'waybill') NOT NULL,
    `template_schema` JSON NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `published_at` TIMESTAMP(0) NULL,
    `deleted_at` TIMESTAMP(0) NULL,

    INDEX `idx_templates_company`(`company_id`),
    INDEX `idx_templates_type`(`document_type`),
    INDEX `idx_templates_status`(`status`),
    INDEX `idx_templates_created_by`(`created_by`),
    UNIQUE INDEX `unique_template_name_per_company`(`company_id`, `name`, `document_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_template_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `template_schema` JSON NOT NULL,
    `published_by` INTEGER NULL,
    `published_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_versions_template`(`template_id`),
    INDEX `idx_versions_published_by`(`published_by`),
    UNIQUE INDEX `unique_template_version`(`template_id`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_templates` ADD CONSTRAINT `fk_templates_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_templates` ADD CONSTRAINT `fk_templates_created_by` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_template_versions` ADD CONSTRAINT `fk_versions_template` FOREIGN KEY (`template_id`) REFERENCES `document_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_template_versions` ADD CONSTRAINT `fk_versions_published_by` FOREIGN KEY (`published_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
