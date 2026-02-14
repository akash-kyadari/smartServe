import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback",
            proxy: true,
            passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({
                    $or: [
                        { googleId: profile.id },
                        { email: profile.emails[0].value }
                    ]
                });

                if (user) {
                    // Update googleId and authProvider if not present
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.authProvider = "google";
                        await user.save();
                    }
                    return done(null, user);
                }

                // If user doesn't exist, create a new one
                // Determine roles based on state
                let roles = ["customer"];
                if (req.query.state) {
                    try {
                        const state = JSON.parse(Buffer.from(req.query.state, "base64").toString());
                        if (state.from === "staff") {
                            roles = ["owner"];
                        }
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }

                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    authProvider: "google",
                    avatar: profile.photos[0]?.value,
                    roles: roles,
                });

                await user.save();
                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    )
);

// We don't really need serialize/deserialize if we are using JWT,
// but Passport might complain if we don't have them during the flow.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
