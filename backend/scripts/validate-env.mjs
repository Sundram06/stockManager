import { env, isProduction } from "../src/config/env.mjs";

const requiredAlways = ["DB_URI", "JWT_SECRET", "FE_URL"];
const requiredInProduction = ["PORT"];

const optionalGroupGoogle = [
	"GOOGLE_CLIENT_ID",
	"GOOGLE_CLIENT_SECRET",
	"GOOGLE_REDIRECT_URI",
];

const getMissing = (keys) => keys.filter((key) => !String(env[key] || "").trim());

const missing = [
	...getMissing(requiredAlways),
	...(isProduction ? getMissing(requiredInProduction) : []),
];

const googleMissing = getMissing(optionalGroupGoogle);

if (missing.length > 0) {
	console.error("Missing required environment variables:");
	missing.forEach((key) => console.error(`- ${key}`));
	process.exit(1);
}

console.log("Required environment variables are configured.");

if (googleMissing.length > 0) {
	console.log(
		`Google OAuth is partially/fully disabled. Missing: ${googleMissing.join(", ")}`,
	);
}

console.log("Environment validation completed.");
