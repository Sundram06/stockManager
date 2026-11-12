import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env, isProduction } from "../config/env.mjs";
import { User } from "../models/index.mjs";
import { createCookieStateStore } from "./oauth-state-store.mjs";

// No server sessions: the callback hands the browser a one-time login code,
// and the OAuth state lives in a cookie.
export const configureGooglePassport = (passport) => {
	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
		return;
	}

	passport.use(
		new GoogleStrategy(
			{
				clientID: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
				callbackURL: env.GOOGLE_REDIRECT_URI,
				store: createCookieStateStore({ secure: isProduction }),
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					const email = profile?.emails?.[0]?.value;
					if (!email) {
						return done(new Error("Google profile email missing"));
					}

					let user = await User.findOne({ email });
					if (!user) {
						user = await User.create({
							googleId: profile.id,
							name: profile.displayName,
							email,
							provider: "google",
							isEmailVerified: true,
						});
					} else if (!user.googleId) {
						user.googleId = profile.id;
						user.provider = "google";
						user.isEmailVerified = true;
						await user.save();
					}

					return done(null, user);
				} catch (error) {
					return done(error);
				}
			},
		),
	);
};
