import express from 'express'
import { createGroup, deleteGroup, getGroup, getUserGroups } from './group.controller.js';


const groupRouter = express.Router();

groupRouter.post("/",createGroup);

groupRouter.get("/",getUserGroups);

groupRouter.get("/:id", getGroup);

groupRouter.delete("/:id", deleteGroup);

export default groupRouter;