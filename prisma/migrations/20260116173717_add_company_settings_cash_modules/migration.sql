-- CreateTable
CREATE TABLE `company_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `logo_url` VARCHAR(500) NULL,
    `primary_color` VARCHAR(7) NULL DEFAULT '#000000',
    `secondary_color` VARCHAR(7) NULL DEFAULT '#666666',
    `font_family` VARCHAR(100) NULL DEFAULT 'Arial',
    `font_size` INTEGER NULL DEFAULT 12,
    `header_text` TEXT NULL,
    `footer_text` TEXT NULL,
    `terms_conditions` TEXT NULL,
    `invoice_prefix` VARCHAR(10) NULL DEFAULT 'INV',
    `invoice_number_format` VARCHAR(100) NULL DEFAULT '{PREFIX}-{YEAR}{MONTH}-{NUMBER}',
    `show_company_logo` BOOLEAN NOT NULL DEFAULT true,
    `show_company_address` BOOLEAN NOT NULL DEFAULT true,
    `show_tax_column` BOOLEAN NOT NULL DEFAULT true,
    `show_discount_column` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `company_settings_company_id_key`(`company_id`),
    INDEX `idx_settings_company`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_cash_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `account_name` VARCHAR(255) NOT NULL,
    `account_number` VARCHAR(100) NULL,
    `bank_name` VARCHAR(255) NULL,
    `initial_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `current_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_cash_company`(`company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_modules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `module_name` VARCHAR(50) NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `config` JSON NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_modules_company`(`company_id`),
    UNIQUE INDEX `unique_company_module`(`company_id`, `module_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_settings` ADD CONSTRAINT `fk_settings_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_cash_accounts` ADD CONSTRAINT `fk_cash_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_modules` ADD CONSTRAINT `fk_modules_company` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
