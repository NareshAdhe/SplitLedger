import express from 'express'
import { login, logout, register } from './auth.controller.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const authRouter = express.Router();

authRouter.post("/login",login);

authRouter.post("/register",register);

authRouter.post("/logout", authMiddleware,logout);

export default authRouter;