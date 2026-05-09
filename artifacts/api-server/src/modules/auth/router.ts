import { Router, type IRouter } from "express";
import { attachAuthSession } from "./middleware";

const router: IRouter = Router();

router.get("/auth/me", attachAuthSession, (req, res) => {
  if (!req.authSession || !req.authUser) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.authUser.id,
        name: req.authUser.name,
        email: req.authUser.email,
        avatar:
          (req.authUser as { avatar?: string | null; image?: string | null }).avatar ??
          (req.authUser as { avatar?: string | null; image?: string | null }).image ??
          null,
        role: (req.authUser as { role?: string }).role ?? "student",
        emailVerified: req.authUser.emailVerified,
      },
      session: {
        id: req.authSession.id,
        userId: req.authSession.userId,
        expiresAt: req.authSession.expiresAt,
      },
    },
  });
});

export default router;
