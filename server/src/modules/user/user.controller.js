import prisma from "../../config/prismaClient.js";

export const getUser = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    console.log(user);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Get User Error", error);
    return res.json({
      success: false,
      message: "Internal server error",
    });
  }
};
