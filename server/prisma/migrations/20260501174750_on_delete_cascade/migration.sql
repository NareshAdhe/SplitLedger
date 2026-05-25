-- DropForeignKey
ALTER TABLE `Contribution` DROP FOREIGN KEY `Contribution_expenseId_fkey`;

-- DropForeignKey
ALTER TABLE `Split` DROP FOREIGN KEY `Split_expenseId_fkey`;

-- DropIndex
DROP INDEX `Contribution_expenseId_fkey` ON `Contribution`;

-- DropIndex
DROP INDEX `Split_expenseId_fkey` ON `Split`;

-- AddForeignKey
ALTER TABLE `Split` ADD CONSTRAINT `Split_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `Expense`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contribution` ADD CONSTRAINT `Contribution_expenseId_fkey` FOREIGN KEY (`expenseId`) REFERENCES `Expense`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
