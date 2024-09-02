import { Router } from "express";
import { config } from "dotenv";
import cors from "cors";
import passport from "passport";
import { authCallback, refresh } from "../controllers/authController";

config();

const router = Router();

router.post(
  "/google",
  cors(),
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Callback URL Configuration
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  authCallback
);

router.get("/refresh", refresh);

export default router;
