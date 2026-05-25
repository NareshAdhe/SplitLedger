import express from 'express'
import { createCircle, deleteCircle, getCircle, getUserCircles } from './circle.controller.js';


const circleRouter = express.Router();

circleRouter.post("/",createCircle);

circleRouter.get("/", getUserCircles);

circleRouter.get("/:id",getCircle);

circleRouter.delete("/:id",deleteCircle);


export default circleRouter;