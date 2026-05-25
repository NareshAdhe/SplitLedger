import "dotenv/config";
import express from "express";
import authRouter from "./src/modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import authMiddleware from "./src/middleware/authMiddleware.js";
import userRouter from "./src/modules/user/user.routes.js";
import groupRouter from "./src/modules/group/group.routes.js";
import circleRouter from "./src/modules/circle/circle.routes.js";
import expenseRouter from "./src/modules/expense/expense.routes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.end("Welcome");
});

app.use("/api/auth", authRouter);
app.use("/api/user", authMiddleware, userRouter);
app.use("/api/group", authMiddleware, groupRouter);
app.use("/api/circle", authMiddleware, circleRouter);
app.use("/api/expense", authMiddleware, expenseRouter);

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
