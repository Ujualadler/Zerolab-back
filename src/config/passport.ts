import passport from "passport";
import passportGoogle from "passport-google-oauth20";
import User from "../models/userSchema";
import { generateAccessToken } from "./jwt";

// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const GOOGLE_CLIENT_ID =
// "240091052176-v86vgp09ptl1qopbrovi1kemosjn3tb9.apps.googleusercontent.com";
// const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
// const GOOGLE_CLIENT_SECRET = "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";

// if(!process.env.GOOGLE_CLIENT_ID ||  !process.env.GOOGLE_CLIENT_SECRET) {
//     return;
// }

const GoogleStrategy = passportGoogle.Strategy;

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "177672774302-ombec3k2f8sg70lj775dj1v2m7719ebv.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        console.log(user);

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0].value,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
