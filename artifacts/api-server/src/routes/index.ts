import { Router, type IRouter } from "express";
import healthRouter from "./health";
import protectedRouter from "./protected";
import authRouter from "../modules/auth/router";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(protectedRouter);

export default router;
