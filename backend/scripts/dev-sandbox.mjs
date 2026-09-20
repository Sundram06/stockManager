// Runs the backend against a private, in-memory copy of the database.
//
//   npm run dev:sandbox
//
// On start it READS the real database (DB_URI) once, copies users, stocks,
// histories and sell events into an in-memory MongoDB replica set, then starts
// the normal server pointed at that copy. Everything you do in the app —
// sells, new lots, deletes, migrations — changes only the copy. Stop the
// process and the copy is gone; the real database is never written.
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

const COLLECTIONS = ["users", "stocks", "histories", "sellevents"];
const realUri = process.env.DB_URI;
if (!realUri) {
	console.error("DB_URI is not set; nothing to copy.");
	process.exit(1);
}

const replset = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
const sandboxUri = replset.getUri("vittnest_sandbox");

const source = await mongoose.createConnection(realUri).asPromise();
const target = await mongoose.createConnection(sandboxUri).asPromise();
for (const name of COLLECTIONS) {
	const docs = await source.db.collection(name).find({}).toArray();
	if (docs.length) await target.db.collection(name).insertMany(docs);
	console.log(`[sandbox] copied ${String(docs.length).padStart(4)} ${name}`);
}
await source.close();
await target.close();

process.env.DB_URI = sandboxUri;
console.log("[sandbox] real database will not be written. Starting server on the copy…\n");

const stop = async () => {
	await replset.stop();
	process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await import("../src/server.mjs");
