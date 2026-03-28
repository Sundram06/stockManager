import mongoose from "mongoose";
import { env } from "../config/env.mjs";

let hasLoggedConnection = false;

const connectMongo = async () => {
	if (!env.DB_URI) {
		console.error("DB_URI is not configured");
		process.exit(1);
	}

	if (mongoose.connection.readyState === 1) {
		return mongoose.connection;
	}

	await mongoose.connect(env.DB_URI);

	if (!hasLoggedConnection) {
		console.log("Connected to mongoose db");
		hasLoggedConnection = true;
	}

	return mongoose.connection;
};

export default connectMongo;