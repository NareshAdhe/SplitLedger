/*
  Warnings:

  - Added the required column `createdById` to the `Circle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Circle` ADD COLUMN `createdById` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Circle` ADD CONSTRAINT `Circle_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
