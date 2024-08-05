import mongoose from "mongoose";

const connectMongo = async () => {
	console.log(process.env.DB_URI);
	try {
		await mongoose.connect(process.env.DB_URI);
	} catch (error) {
		console.error("Error connecting to mongo", error);
		process.exit();
	}
};
console.log("connect to mongoose db");
export default connectMongo;
