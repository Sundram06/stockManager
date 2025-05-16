import express from "express";
import connectMongo from "./db/database.mjs";
import { User, Stock, History } from "./db/model.mjs";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { extractData } from "./assets/extractDataa.mjs";
// import UpstoxClient from "upstox-js-sdk";

connectMongo();
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 3000;
const JWT_SECRET = "your_jwt_secret";
app.get("/", async (req, res) => {
	console.log("Hello hi");
});

extractData();

app.get("/api/upstox/login", (req, res) => {
	const loginUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${process.env.UPSTOX_API_KEY}&redirect_uri=${process.env.UPSTOX_REDIRECT_URI}`;
	console.log(loginUrl);
	res.json(loginUrl);
});

app.get("/api/upstocks/callback", async (req, res) => {
	const authorizationCode = req.query.code;
	console.log("redirected to upstocks/callback");
	console.log("authorizationCode", authorizationCode);
	process.env["upstox_auth_code"] = authorizationCode;

	try {
		const url = "https://api.upstox.com/v2/login/authorization/token";
		const headers = {
			accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const body = new URLSearchParams();
		body.append("code", authorizationCode);
		body.append("client_id", process.env.UPSTOX_API_KEY);
		body.append("client_secret", process.env.UPSTOX_API_SECRET);
		body.append("redirect_uri", process.env.UPSTOX_REDIRECT_URI);
		body.append("grant_type", "authorization_code");
		console.log(url);
		fetch(url, {
			method: "POST",
			headers: headers,
			body: body.toString(),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log(data);
				process.env["access_token"] = data.access_token;
				res.redirect("http://localhost:5173/");
				// res.send("Upstox authentication successful. API calls possible now.");
			})
			.catch((error) => console.error("Error:", error));
	} catch (error) {
		console.error("Error during upstox OAuth process", error);
		res.status(500).send("Error during upstox OAuth process");
	}
});

const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers["authorization"];
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

app.get("/api/stocks/ltp/:symbol", authenticateJWT, async (req, res) => {
	const { symbol } = req.params;
	try {
		const accessToken = req.session.accessToken;
		upstox.setAccessToken(accessToken);
		const stockData = await upstox.getQuote(symbol); // Adjust this based on Upstox API documentation
		res.json(stockData);
	} catch (error) {
		res.status(500).json({ message: "Error fetching stock data", error });
	}
});

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
				expiresIn: "10h",
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
			const totalCostOfStock = parseFloat(
				(stock.quantity * stock.avgPrice).toFixed(2)
			);
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

app.post("/history/sell", authenticateJWT, async (req, res) => {
	try {
		const { quantity, avgPrice, date, stockId } = req.body;

		const quantityToSell = Number(quantity);
		const sellingPrice = Number(avgPrice);
		const dateSold = new Date(date);

		let remainingToSell = quantityToSell;
		let totalPnl = 0;
		let updatedRows = [];

		const fifoRows = await History.find({
			stockId,
			$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
		}).sort({ date: 1 });

		if (!fifoRows.length) {
			return res.status(400).json({ message: "No stock to sell" });
		}

		for (let row of fifoRows) {
			if (remainingToSell <= 0) break;

			const alreadySold = row.quantitySold || 0;
			const available = row.quantity - alreadySold;
			const sellQty = Math.min(remainingToSell, available);

			// Profit for this transaction
			const pnl = sellQty * (sellingPrice - row.avgPrice);
			totalPnl += pnl;

			// Weighted average selling price
			const prevTotalSellValue = (row.sellingPrice || 0) * alreadySold;
			const newTotalSellValue = prevTotalSellValue + sellingPrice * sellQty;
			const newQtySold = alreadySold + sellQty;
			const newAvgSellingPrice = newTotalSellValue / newQtySold;

			// Update row
			row.quantitySold = newQtySold;
			row.sellingPrice = newAvgSellingPrice;
			row.dateSold = dateSold; // Latest date
			row.pnl = (row.pnl || 0) + pnl;

			await row.save();
			updatedRows.push(row);

			remainingToSell -= sellQty;
		}

		if (remainingToSell > 0) {
			return res.status(400).json({ message: "Not enough stock to sell" });
		}

		res.status(200).json({
			message: "Stock sold using FIFO",
			totalPnl,
			updatedRows,
		});
	} catch (error) {
		console.error("Sell API error:", error);
		res.status(500).json({ message: "Internal Server Error" });
	}
});


// app.post("/history/sell", authenticateJWT, async (req, res) => {
// 	try {
// 		// Correct destructuring based on frontend data
// 		const { quantity, avgPrice, date, stockId } = req.body;

// 		// Convert data types correctly
// 		const quantitySold = Number(quantity); // Ensure it's a number
// 		const sellingPrice = Number(avgPrice); // Ensure it's a number
// 		const dateSold = new Date(date); // Convert string to Date object

// 		console.log("Processed Sell Stock Request:", {
// 			quantitySold,
// 			sellingPrice,
// 			dateSold,
// 			stockId,
// 		});

// 		// Fetch stock history in FCFS order, including partially sold stocks
// 		let purchaseHistory = await History.find({
// 			stockId,
// 			$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
// 		}).sort({ date: 1 });

// 		if (!purchaseHistory.length) {
// 			return res.status(400).json({ message: "No available stock to sell." });
// 		}

// 		let remainingToSell = quantitySold;
// 		let totalPnl = 0;
// 		let updatedEntries = [];

// 		for (let purchase of purchaseHistory) {
// 			if (remainingToSell <= 0) break; // Stop when all stocks are sold

// 			let availableQty = purchase.quantity - (purchase.quantitySold || 0);
// 			let sellQty = Math.min(remainingToSell, availableQty);
// 			let pnlForThisSale = sellQty * (sellingPrice - purchase.avgPrice);
// 			totalPnl += pnlForThisSale;

// 			// Update the existing history entry
// 			let updatedHistory = await History.findByIdAndUpdate(
// 				purchase._id,
// 				{
// 					$set: { dateSold, sellingPrice },
// 					$inc: { quantitySold: sellQty, pnl: pnlForThisSale },
// 				},
// 				{ new: true } // This returns the modified document
// 			);

// 			updatedEntries.push(updatedHistory); // Store updated records for frontend

// 			remainingToSell -= sellQty;
// 		}

// 		if (remainingToSell > 0) {
// 			return res
// 				.status(400)
// 				.json({ message: "Not enough stocks available to sell." });
// 		}

// 		// Fetch updated history
// 		const updatedHistoryTable = await History.find({ stockId }).sort({
// 			date: 1,
// 		});

// 		res.json({
// 			message: "Stock sold successfully",
// 			totalPnl,
// 			updatedHistory: updatedHistoryTable,
// 		});
// 	} catch (error) {
// 		console.error("Error processing stock sale:", error);
// 		res.status(500).json({ message: "Internal server error" });
// 	}
// });

// app.post("/history/sell", authenticateJWT, async (req, res) => {
// 	const newSellHistory = req.body;
// 	console.log("post history request");
// 	console.log("newhistory ", newSellHistory);
// 	const sellHistory = await History.findById(newSellHistory._id);
// });

app.listen(port, () => {
	console.log("Server running on port : ", port);
});
