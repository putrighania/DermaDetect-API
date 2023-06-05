-- CreateTable
CREATE TABLE `article` (
    `id` VARCHAR(100) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` VARCHAR(1000) NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `author` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `article_UN`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
