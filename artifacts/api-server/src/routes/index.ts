import { Router, type IRouter } from "express";
import healthRouter from "./health";
import protectedRouter from "./protected";
import authRouter from "../modules/auth/router";
import v1Router from "./v1";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(protectedRouter);
router.use("/v1", v1Router);

export default router;
