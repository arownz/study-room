import { Router, type IRouter } from "express";
import { attachAuthSession } from "./middleware";
import { AuthController } from "./controller";
import { AuthRepository } from "./repository";
import { AuthService } from "./service";

const router: IRouter = Router();
const repository = new AuthRepository();
const service = new AuthService(repository);
const controller = new AuthController(service);

router.get("/auth/me", attachAuthSession, controller.getMe);

export default router;
