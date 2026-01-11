-- CreateTable
CREATE TABLE `otp_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `otp_code` VARCHAR(6) NOT NULL,
    `purpose` VARCHAR(50) NOT NULL DEFAULT 'email_verification',
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` TIMESTAMP(0) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_otp_email`(`email`),
    INDEX `idx_otp_code`(`otp_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- RenameIndex
ALTER TABLE `users` RENAME INDEX `unique_user_email` TO `users_email_key`;
