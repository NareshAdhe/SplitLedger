import prisma from "../../config/prismaClient.js";

const applyBalanceChanges = async (
  tx,
  groupId,
  expenseId,
  balanceMap,
  splits = [],
  contributions = [],
) => {
  const contributionsData = contributions.map((c) => ({
    userId: c.userId,
    amount: c.amount,
    expenseId,
  }));

  if (contributionsData.length > 0) {
    await tx.contribution.createMany({
      data: contributionsData,
    });
  }

  const splitsData = splits.map((s) => ({
    userId: s.userId,
    amount: s.amount,
    expenseId,
  }));

  if (splits.length > 0) {
    await tx.split.createMany({
      data: splitsData,
    });
  }

  const debtors = [];
  const creditors = [];

  for (const [userId, balance] of Object.entries(balanceMap)) {
    if (balance > 0) {
      creditors.push({ userId: Number(userId), amount: balance });
    } else if (balance < 0) {
      debtors.push({ userId: Number(userId), amount: -balance });
    }
  }

  creditors.sort((a, b) => a.amount - b.amount);
  debtors.sort((a, b) => a.amount - b.amount);

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.amount, creditor.amount);

    const u1 = Math.min(debtor.userId, creditor.userId);
    const u2 = Math.max(debtor.userId, creditor.userId);

    const isU1Debtor = u1 === debtor.userId;

    await tx.balance.upsert({
      where: {
        user1Id_user2Id_groupId: {
          user1Id: u1,
          user2Id: u2,
          groupId,
        },
      },
      create: {
        user1Id: u1,
        user2Id: u2,
        groupId,
        amount: isU1Debtor ? settledAmount : -settledAmount,
      },
      update: {
        amount: isU1Debtor
          ? { increment: settledAmount }
          : { decrement: settledAmount },
      },
    });

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount <= 0) i++;
    if (creditor.amount <= 0) j++;
  }

  await tx.balance.deleteMany({
    where: {
      groupId,
      amount: 0,
    },
  });
};

const handleValidation = async (body, userId) => {
  const {
    groupId,
    title,
    description,
    amount,
    contributions = [],
    splits = [],
  } = body;

  if (!groupId) {
    return "Group ID is required";
  }

  if (!title) {
    return "title is required";
  }

  if (!amount || isNaN(amount)) {
    return "Invalid amount";
  }

  const checkDuplicates = (arr) => {
    const ids = arr.map((u) => u.userId);
    return new Set(ids).size !== arr.length;
  };

  if (checkDuplicates(contributions) || checkDuplicates(splits)) {
    return "Duplicate users in contributions or splits";
  }

  if (
    contributions.some((c) => c.amount <= 0) ||
    splits.some((s) => s.amount <= 0)
  ) {
    return "Amounts must be positive";
  }

  const contributionAmount = contributions.reduce((sum, curr) => {
    return sum + curr.amount;
  }, 0);

  const splitAmount = splits.reduce((sum, curr) => {
    return sum + curr.amount;
  }, 0);

  if (
    contributions.length === 0 ||
    splits.length === 0 ||
    contributionAmount !== amount ||
    splitAmount !== amount
  ) {
    return "Invalid expense data";
  }

  let userIds = [
    userId,
    ...contributions.map((c) => c.userId),
    ...splits.map((s) => s.userId),
  ];

  const uniqueUserIds = new Set(userIds);

  userIds = [...uniqueUserIds];

  const groupMembers = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: {
        in: userIds,
      },
    },
    select: {
      userId: true,
    },
  });

  const validUserIds = new Set(groupMembers.map((gm) => gm.userId));

  if (!validUserIds.has(userId)) {
    return "You are not the part of this group";
  }

  for (const id of uniqueUserIds) {
    if (!validUserIds.has(id)) {
      return "Some user is not the part of this group";
    }
  }

  return null;
};

export const createExpense = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      groupId,
      title,
      description,
      amount,
      contributions = [],
      splits = [],
    } = req.body;

    const errorMessage = await handleValidation(req.body, userId);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const expense = await tx.expense.create({
          data: {
            title,
            description,
            amount,
            groupId,
            createdById: userId,
          },
        });

        const currentBalances = await tx.balance.findMany({
          where: {
            groupId,
          },
        });

        const balanceMap = {};

        // 2. Add current new expense changes
        contributions.forEach((c) => {
          balanceMap[c.userId] = (balanceMap[c.userId] || 0) + Number(c.amount);
        });

        splits.forEach((s) => {
          balanceMap[s.userId] = (balanceMap[s.userId] || 0) - Number(s.amount);
        });

        // 3. Merge existing group balances with absolute sign checks
        currentBalances.forEach((b) => {
          const absAmount = Math.abs(Number(b.amount));
          if (Number(b.amount) > 0) {
            balanceMap[b.user1Id] = (balanceMap[b.user1Id] || 0) - absAmount;
            balanceMap[b.user2Id] = (balanceMap[b.user2Id] || 0) + absAmount;
          } else if (Number(b.amount) < 0) {
            balanceMap[b.user1Id] = (balanceMap[b.user1Id] || 0) + absAmount;
            balanceMap[b.user2Id] = (balanceMap[b.user2Id] || 0) - absAmount;
          }
        });

        // 4. Reset balances table for group
        await tx.balance.deleteMany({
          where: { groupId },
        });

        // 5. Apply matched balances once
        await applyBalanceChanges(
          tx,
          groupId,
          expense.id,
          balanceMap,
          splits,
          contributions,
        );

        return expense;
      },
      {
        timeout: 10000,
      },
    );

    return res.status(201).json({
      success: true,
      expenseId: result.id,
    });
  } catch (error) {
    console.log("Get User Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const editExpense = async (req, res) => {
  try {
    const userId = req.userId;
    const expenseId = Number(req.params.id);
    const {
      groupId,
      title,
      description,
      amount,
      contributions = [],
      splits = [],
      isFinancialUpdate = true,
    } = req.body;

    if (!expenseId) {
      return res.status(400).json({
        success: false,
        message: "ExpenseId is required",
      });
    }

    const errorMessage = await handleValidation(req.body, userId);

    if (errorMessage) {
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // expense exists or not
    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
    });

    if (!expense) {
      return res.status(400).json({
        success: false,
        message: "Expense does not exist",
      });
    }

    const result = await prisma.$transaction(
      async (tx) => {
        if (!isFinancialUpdate) {
          const expense = await tx.expense.update({
            where: { id: expenseId },
            data: { title, description },
          });

          return expense;
        }

        const expense = await tx.expense.update({
          where: { id: expenseId },
          data: { title, description, amount },
        });

        // contributions of this expense
        const oldContributions = await tx.contribution.findMany({
          where: {
            expenseId,
          },
          select: {
            userId: true,
            amount: true,
          },
        });

        // delete the old contributions
        await tx.contribution.deleteMany({
          where: {
            expenseId,
          },
        });

        // splits of this expense
        const oldSplits = await tx.split.findMany({
          where: {
            expenseId,
          },
          select: {
            userId: true,
            amount: true,
          },
        });

        // delete the old contributions
        await tx.split.deleteMany({
          where: {
            expenseId,
          },
        });

        const currentBalances = await tx.balance.findMany({
          where: {
            groupId,
          },
        });

        const netBalanceMap = {};

        // 1. REVERT old contributions and splits
        oldContributions.forEach((c) => {
          netBalanceMap[c.userId] =
            (netBalanceMap[c.userId] || 0) - Number(c.amount);
        });
        oldSplits.forEach((s) => {
          netBalanceMap[s.userId] =
            (netBalanceMap[s.userId] || 0) + Number(s.amount);
        });

        // 2. APPLY new contributions and splits
        contributions.forEach((c) => {
          netBalanceMap[c.userId] =
            (netBalanceMap[c.userId] || 0) + Number(c.amount);
        });
        splits.forEach((s) => {
          netBalanceMap[s.userId] =
            (netBalanceMap[s.userId] || 0) - Number(s.amount);
        });

        // 3. MERGE current ledger with absolute value checks
        currentBalances.forEach((b) => {
          const absAmount = Math.abs(Number(b.amount));
          if (Number(b.amount) > 0) {
            netBalanceMap[b.user1Id] =
              (netBalanceMap[b.user1Id] || 0) - absAmount;
            netBalanceMap[b.user2Id] =
              (netBalanceMap[b.user2Id] || 0) + absAmount;
          } else if (Number(b.amount) < 0) {
            netBalanceMap[b.user1Id] =
              (netBalanceMap[b.user1Id] || 0) + absAmount;
            netBalanceMap[b.user2Id] =
              (netBalanceMap[b.user2Id] || 0) - absAmount;
          }
        });

        // 4. Clear old balance records completely
        await tx.balance.deleteMany({
          where: { groupId },
        });

        // 5. Apply balanced state exactly once
        await applyBalanceChanges(
          tx,
          groupId,
          expenseId,
          netBalanceMap,
          splits,
          contributions,
        );

        return expense;
      },
      { timeout: 10000 },
    );

    return res.status(200).json({
      success: true,
      expense: result,
    });
  } catch (error) {
    console.log("Get User Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const userId = req.userId;
    const expenseId = Number(req.params.id);

    if (!expenseId) {
      return res.status(400).json({
        success: false,
        message: "ExpenseId is required",
      });
    }

    // expense exists or not
    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
    });

    if (!expense) {
      return res.status(400).json({
        success: false,
        message: "Expense does not exist",
      });
    }

    const groupId = expense.groupId;

    await prisma.$transaction(
      async (tx) => {
        // contributions of this expense
        const oldContributions = await tx.contribution.findMany({
          where: {
            expenseId,
          },
          select: {
            userId: true,
            amount: true,
          },
        });

        // delete the old contributions
        await tx.contribution.deleteMany({
          where: {
            expenseId,
          },
        });

        // splits of this expense
        const oldSplits = await tx.split.findMany({
          where: {
            expenseId,
          },
          select: {
            userId: true,
            amount: true,
          },
        });

        // delete the old contributions
        await tx.split.deleteMany({
          where: {
            expenseId,
          },
        });

        const currentBalances = await tx.balance.findMany({
          where: {
            groupId,
          },
        });

        const balanceMap = {};

        // 1. REVERT old contributions and splits
        oldContributions.forEach((c) => {
          balanceMap[c.userId] = (balanceMap[c.userId] || 0) - Number(c.amount);
        });
        oldSplits.forEach((s) => {
          balanceMap[s.userId] = (balanceMap[s.userId] || 0) + Number(s.amount);
        });

        // 3. MERGE current ledger with absolute value checks
        currentBalances.forEach((b) => {
          const absAmount = Math.abs(Number(b.amount));
          if (Number(b.amount) > 0) {
            balanceMap[b.user1Id] = (balanceMap[b.user1Id] || 0) - absAmount;
            balanceMap[b.user2Id] = (balanceMap[b.user2Id] || 0) + absAmount;
          } else if (Number(b.amount) < 0) {
            balanceMap[b.user1Id] = (balanceMap[b.user1Id] || 0) + absAmount;
            balanceMap[b.user2Id] = (balanceMap[b.user2Id] || 0) - absAmount;
          }
        });

        // 4. Clear old balance records completely
        await tx.balance.deleteMany({
          where: { groupId },
        });

        // 5. Apply balanced state exactly once
        await applyBalanceChanges(tx, groupId, expenseId, balanceMap);

        await tx.expense.delete({
          where: {
            id: expenseId,
          },
        });
      },
      { timeout: 10000 },
    );

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.log("Get User Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getExpense = async (req, res) => {
  try {
    const expenseId = Number(req.params.id);
    if (!expenseId) {
      return res.status(400).json({
        success: false,
        message: "Expense Id is required",
      });
    }

    const expense = await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        contributions: {
          select: {
            amount: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        splits: {
          select: {
            amount: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    expense.contributions = expense.contributions.map((c) => {
      return {
        amount: c.amount,
        ...c.user,
      };
    });

    expense.splits = expense.splits.map((s) => {
      return {
        amount: s.amount,
        ...s.user,
      };
    });

    return res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error("Get Expense Detail Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
