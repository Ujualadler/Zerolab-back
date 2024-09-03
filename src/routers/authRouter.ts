import { Router } from "express";
import passport from "passport";
import { authCallback, refresh } from "../controllers/authController";

const router = Router();

// Redirect to Google for authentication
router.post(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Handle the Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    successRedirect:'http://localhost:3000',
    failureRedirect: "/login",
  }),
  authCallback
);

router.get("/refresh", refresh);

export default router;
