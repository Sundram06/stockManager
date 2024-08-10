import express from "express";
import connectMongo from "./db/database.mjs";
import { User, Stock, History } from "./db/model.mjs";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

connectMongo();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 3000;
const JWT_SECRET = "your_jwt_secret";
app.get("/", async (req, res) => {
	console.log("Hello hi");
});

const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers["authorization"];
	// console.log(req.headers);
	if (authHeader && authHeader.startsWith("Bearer ")) {
		const token = authHeader.split(" ")[1];
		jwt.verify(token, JWT_SECRET, (err, user) => {
			if (err) {
				return res.sendStatus(403);
			}
			req.userId = user.userId;
			next();
		});
	} else {
		res.sendStatus(401);
	}
};

app.post("/register", async (req, res) => {
	const { name, email, password } = req.body;
	try {
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "Email already exists" });
		}
		const hashedPassword = await bcrypt.hash(password, 10);
		const newUser = new User({ name, email, password: hashedPassword });
		await newUser.save();
		res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		console.log("Registration error : ", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.post("/login", async (req, res) => {
	const { email, password } = req.body;
	console.log("Login request received:", email);
	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}
		console.log("user pass token", user.password);
		const isPasswordValid = bcrypt.compare(password, user.password);
		if (user && isPasswordValid) {
			const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
				expiresIn: "1h",
			});
			console.log("Login successful for:", email);
			res.json({ user, token });
		} else {
			console.log("Invalid credentials for:", email);
			res.status(401).json({ message: "Invalid credentials" });
		}
	} catch (error) {
		console.log("Login error : ", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.post("/logout", (req, res) => {
	console.log("Logout request received");
	res.json({ message: "Logout successful" });
});

app.use(authenticateJWT);

app.post("/stocks", authenticateJWT, async (req, res) => {
	const newStock = req.body;
	console.log(newStock);
	newStock.userId = req.userId;
	const stock = new Stock(newStock);
	newStock.stockId = stock._id;
	const history = new History(newStock);
	await stock.save();
	await history.save();
	console.log("posted", newStock);
	res.json(newStock);
});

app.get("/stocks", authenticateJWT, async (req, res) => {
	try {
		const userId = new mongoose.Types.ObjectId(req.userId);
		const stocks = await Stock.find({ userId });
		const updatedStocks = [];

		for (const stock of stocks) {
			const totalCostOfStock = stock.quantity * stock.avgPrice;
			stock.ltp = 20;
			stock.currVal = 20;
			stock.pnl = 20;
			stock.netChange = 20;
			stock.dayChange = 20;
			stock.totalCostOfStock = totalCostOfStock;

			// Save the updated stock document
			const updatedStock = await stock.save();
			updatedStocks.push(updatedStock);
		}

		console.log("updted stocks", updatedStocks);
		res.json(updatedStocks);
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

app.delete("/stocks", authenticateJWT, async (req, res) => {
	try {
		await Stock.deleteMany({});
		await History.deleteMany({});
		console.log("All stocks and history deleted");
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

app.get("/history", authenticateJWT, async (req, res) => {
	try {
		const history = await History.find();
		// console.log(history);
		res.json(history);
	} catch (error) {
		console.log("error fetching history");
	}
});

app.post("/history", authenticateJWT, async (req, res) => {
	const newHistory = req.body;
	console.log("post history request");
	console.log("newhistory ", newHistory);
	const history = new History({
		stockId: new mongoose.Types.ObjectId(newHistory.stockId),
		...newHistory,
	});

	const stock = await Stock.findById(history.stockId);
	stock.avgPrice = Number(
		(stock.avgPrice * stock.quantity + history.quantity * history.avgPrice) /
			(stock.quantity + history.quantity)
	).toFixed(2);
	stock.quantity = stock.quantity + history.quantity;

	await Promise.all([stock.save(), history.save()]);
	res.json({ history, stock });
});

app.listen(port, () => {
	console.log("Server running on port : ", port);
});
