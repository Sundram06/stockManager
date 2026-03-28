import connectMongo from "./models/connection.mjs";
import { extractData } from "../assets/extractData.mjs";
import { env } from "./config/env.mjs";
import { createApp } from "./app.mjs";

connectMongo();
extractData();

const app = createApp();

app.listen(env.PORT, () => {
	console.log("Server running on port:", env.PORT);
});
