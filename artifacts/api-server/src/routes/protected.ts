import { Router, type IRouter } from "express";
import { sendSuccess } from "../core/http/response";
import { requireAuth } from "../modules/auth/middleware";

const router: IRouter = Router();

router.get("/protected/dashboard", requireAuth, (req, res) => {
  sendSuccess(res, {
      message: "Protected dashboard data",
      user: {
        id: req.authUser?.id,
        name: req.authUser?.name,
        email: req.authUser?.email,
        avatar:
          (req.authUser as { avatar?: string | null; image?: string | null } | undefined)
            ?.avatar ??
          (req.authUser as { avatar?: string | null; image?: string | null } | undefined)
            ?.image ??
          null,
        role: (req.authUser as { role?: string } | undefined)?.role ?? "student",
        emailVerified: req.authUser?.emailVerified ?? false,
      },
      session: {
        id: req.authSession?.id,
        userId: req.authSession?.userId,
        expiresAt: req.authSession?.expiresAt,
      },
  });
});

export default router;
