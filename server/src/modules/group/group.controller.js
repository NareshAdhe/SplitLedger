import prisma from "../../config/prismaClient.js";

export const createGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, description, members = [] } = req.body;
    console.log(title, description, members);
    const allMembers = [...new Set([userId, ...members])];

    const group = await prisma.$transaction(async (tx) => {
      const group = await tx.group.create({
        data: {
          title,
          description,
          createdById: userId,
        },
      });

      const allGroupMembersRows = allMembers.map((memberId) => {
        return {
          userId: memberId,
          groupId: group.id,
        };
      });

      await tx.groupMember.createMany({
        data: allGroupMembersRows,
      });

      return group;
    });

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      groupId: group.id,
    });
  } catch (error) {
    console.log("Group Creation Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.userId;

    const groupMembers = await prisma.groupMember.findMany({
      where: { userId },
      select: {
        group: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });

    const groups = groupMembers.map((gm) => ({
      ...gm.group,
      description: gm.group.description || "",
    }));

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Get Groups Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteGroup = async (req,res) => {
  try {
    const userId = req.userId;
  const groupId = Number(req.params.id);

  if(!groupId){
    return res.status(400).json({
      success: false,
      message: "Group Id is required"
    })
  }

  // does the group exist
  const group = await prisma.group.findUnique({
    where: {
      id: groupId
    }
  });

  if(!group){
    return res.status(400).json({
      success: false,
      message: "Group does not exist"
    })
  }

  // check if the user is the owner of the group
  if(group.createdById !== userId){
    return res.status(403).json({
      success: false,
      message: "You are not allowed to delete this group"
    })
  }

  await prisma.$transaction(async (tx) => {
    await tx.expense.deleteMany({
      where: {
        groupId
      }
    });

    await tx.balance.deleteMany({
      where: {
        groupId
      }
    });

    await tx.groupMember.deleteMany({
      where: {
        groupId
      }
    });

    await tx.group.delete({
      where: {
        id: groupId
      }
    });

  })

  return res.status(200).json({
    success: true,
    message: "Group Deleted Successfully"
  });
  } catch (error) {
    console.log("Expense delete error", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}

export const getGroup = async (req, res) => {
  try {
    const userId = req.userId;
    const groupId = Number(req.params.id);

    if(!groupId){
      return res.status(400).json({
        success: false,
        message: "Group Id is required"
      });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: groupId
      },
      select: {
        id: true,
        title: true,
        description: true,
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const groupMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const normalisedMembers = groupMembers.map((me) => me.user);

    const groupExpenses = await prisma.expense.findMany({
      where: {
        groupId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        amount: true,
        createdAt: true,
        contributions: {
          select: {
            user: { select: { id: true, name: true } },
            amount: true
          }
        },
        splits: {
          select: {
            user: { select: { id: true, name: true } },
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const groupBalances = await prisma.balance.findMany({
      where: {
        groupId,
      },
      select: {
        user1Id: true,
        user2Id: true,
        amount: true,
      },
    });

    const normalisedBalances = groupBalances.map((b) => {
      if (b.amount > 0) {
        return {
          from: b.user1Id,
          to: b.user2Id,
          amount: b.amount,
        };
      } else {
        return {
          from: b.user2Id,
          to: b.user1Id,
          amount: Math.abs(b.amount),
        };
      }
    });

    const finalResult = {
      ...group,
      "members": normalisedMembers,
      "balances": normalisedBalances,
      "expenses": groupExpenses 
    }

    return res.status(200).json({
      success: true,
      group: finalResult
    })
  } catch (error) {
    console.error("Get Group Detail Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
