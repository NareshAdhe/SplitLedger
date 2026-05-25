import express from 'express'
import { createExpense, deleteExpense, editExpense, getExpense } from './expense.controller.js';

const expenseRouter = express.Router();

expenseRouter.post("/",createExpense);

expenseRouter.patch("/:id",editExpense);

expenseRouter.get("/:id",getExpense);

expenseRouter.delete("/:id",deleteExpense);

export default expenseRouter;