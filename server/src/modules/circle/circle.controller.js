import prisma from "../../config/prismaClient.js";

export const createCircle = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, members } = req.body;
    const circle = await prisma.$transaction(async (tx) => {
      const newCircle = await tx.circle.create({
        data: {
          title,
          createdById: userId,
        },
      });
      const allMembersData = members.map((member) => ({
        circleId: newCircle.id,
        userId: member,
      }));

      await tx.circleMember.createMany({
        data: allMembersData,
      });

      return newCircle;
    });

    return res.status(200).json({
      success: true,
      circleId: circle.id,
    });
  } catch (error) {
    console.log("Create Circle Error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getUserCircles = async (req, res) => {
  try {
    const userId = req.userId;

    const userCircles = await prisma.circle.findMany({
      where: {
        createdById: userId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return res.status(200).json({
      success: true,
      circles: userCircles,
    });
  } catch (error) {
    console.error("Get Circles Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCircle = async (req, res) => {
  try {
    const userId = req.userId;
    const circleId = Number(req.params.id);

    if (!circleId) {
      return res.status(400).json({
        success: false,
        message: "Circle Id is required",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.circleMember.deleteMany({
        where: {
          circleId
        }
      });

      await tx.circle.delete({
        where: {
          id: circleId
        }
      });
    })

    return res.status(200).json({
      success: true,
      message: "Circle Deleted Successfully"
    });

  } catch (error) {
    console.error("Delete Circle Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCircle = async (req, res) => {
  try {
    const userId = req.userId;
    const circleId = parseInt(req.params.id);
    const circle = await prisma.circle.findUnique({
      where: {
        id: circleId,
      },
      select: {
        title: true,
        members: {
          select: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!circle) {
      return res.json({
        success: false,
        message: "No circle exist",
      });
    }

    const formattedCircle = {
      ...circle,
      members: circle.members.map((m) => m.user),
    };

    console.log(formattedCircle);

    return res.status(200).json({
      success: true,
      circle: formattedCircle,
    });
  } catch (error) {
    console.error("Get Group Detail Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
