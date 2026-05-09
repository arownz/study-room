import { Router, type IRouter } from "express";
import healthRouter from "../health";
import authRouter from "../../modules/auth/router";
import protectedRouter from "../protected";
import usersRouter from "../../modules/users/router";
import notesRouter from "../../modules/notes/router";
import studyRoomsRouter from "../../modules/study-rooms/router";
import flashcardsRouter from "../../modules/flashcards/router";
import aiRouter from "../../modules/ai/router";
import collaborationRouter from "../../modules/collaboration/router";

const v1Router: IRouter = Router();

v1Router.use(healthRouter);
v1Router.use(authRouter);
v1Router.use(protectedRouter);
v1Router.use(usersRouter);
v1Router.use(notesRouter);
v1Router.use(studyRoomsRouter);
v1Router.use(flashcardsRouter);
v1Router.use(aiRouter);
v1Router.use(collaborationRouter);

export default v1Router;
