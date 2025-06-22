import express from "express";
import connectMongo from "./db/database.mjs";
import { User, Stock, History } from "./db/model.mjs";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { extractData } from "./assets/extractDataa.mjs";
import dotenv from "dotenv";
import fetch from "node-fetch";
import session from "express-session";
// import UpstoxClient from "upstox-js-sdk";

// 1. Load .env file based on NODE_ENV
dotenv.config({
	path:
		process.env.NODE_ENV === "production"
			? ".env.production"
			: ".env.development",
});

// 2. Make sure all env vars are loaded
const {
	FE_URL,
	PORT = 3000,
	JWT_SECRET,
	UPSTOX_API_KEY,
	UPSTOX_API_SECRET,
	UPSTOX_REDIRECT_URI,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	SESSION_SECRET,
} = process.env;

connectMongo();
const app = express();
app.use(
	cors({
		origin: FE_URL,
		credentials: true,
	})
);
app.use(bodyParser.json());

app.use(
	session({
		secret: SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
		cookie: {
			secure: process.env.NODE_ENV === "production", // Use secure cookies in prod
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		},
	})
);

// 7. Passport Google OAuth2 setup
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
app.use(passport.initialize());
app.use(passport.session());

// Serialize and deserialize user (for sessions)
passport.serializeUser((user, done) => {
	done(null, user);
});
passport.deserializeUser((obj, done) => {
	done(null, obj);
});

// Configure Google OAuth2 Strategy
passport.use(
	new GoogleStrategy(
		{
			clientID: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_REDIRECT_URI, // You can change this route as needed
		},
		async function (accessToken, refreshToken, profile, done) {
			let user = await User.findOne({ email: profile.emails[0].value });
			if (!user) {
				user = await User.create({
					googleId: profile.id,
					name: profile.displayName,
					email: profile.emails[0].value,
					provider: "google",
				});
			} else if (!user.googleId) {
				user.googleId = profile.id;
				user.provider = "google";
				await user.save();
			}
			// When creating JWT, always use user._id
			return done(null, user);
		}
	)
);


const port = process.env.PORT || 3000;
// const JWT_SECRET = "your_jwt_secret";

app.get("/", async (req, res) => {
	console.log("Hello hi");
});

extractData();

// Upstox login URL
app.get("/api/upstox/login", (req, res) => {
	const loginUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${UPSTOX_REDIRECT_URI}`;
	res.json(loginUrl);
});

// Upstox callback
app.get("/api/upstocks/callback", async (req, res) => {
	const authorizationCode = req.query.code;
	try {
		const url = "https://api.upstox.com/v2/login/authorization/token";
		const headers = {
			accept: "application/json",
			"Content-Type": "application/x-www-form-urlencoded",
		};

		const body = new URLSearchParams();
		body.append("code", authorizationCode);
		body.append("client_id", UPSTOX_API_KEY);
		body.append("client_secret", UPSTOX_API_SECRET);
		body.append("redirect_uri", UPSTOX_REDIRECT_URI);
		body.append("grant_type", "authorization_code");

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: body.toString(),
		});

		const data = await response.json();
		process.env["access_token"] = data.access_token;

		// Redirect to frontend after login (use FE_URL for prod, localhost for dev)
		res.redirect(FE_URL + "/");
	} catch (error) {
		console.error("Error during upstox OAuth process", error);
		res.status(500).send("Error during upstox OAuth process");
	}
});

// Google OAuth2 login
app.get(
	"/api/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth2 callback
app.get(
	"/api/auth/google/callback",
	passport.authenticate("google", {
		failureRedirect: FE_URL + "/login",
		session: true,
	}),
	(req, res) => {
		// Create a JWT for this user
		const token = jwt.sign({ userId: req.user._id }, JWT_SECRET, {
			expiresIn: "10h",
		});
		// Redirect to FE with token in query param
		res.redirect(`${FE_URL}/oauth-success?token=${token}`);
	}
);

// JWT authentication middleware
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

// Add this route after your authenticateJWT middleware
app.get("/api/me", authenticateJWT, async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password"); // don't send password
		if (!user) return res.status(404).json({ message: "User not found" });
		console.log("User profile fetched:", user);
		res.json(user);
	} catch (err) {
		res.status(500).json({ message: "Error fetching user profile" });
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
		console.log("Registration error:", error);
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
		const isPasswordValid = await bcrypt.compare(password, user.password);
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
		console.log("Login error:", error);
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
		const stocksList = [];

		for (const stock of stocks) {
			// Fetch all purchase rows for this stock from History
			const historyRows = await History.find({ stockId: stock._id }).sort({
				date: 1,
			});

			let totalRemainingQty = 0;
			let totalRemainingCost = 0;

			for (const row of historyRows) {
				const quantitySold = row.quantitySold || 0;
				const remainingQty = row.quantity - quantitySold;

				if (remainingQty > 0) {
					totalRemainingQty += remainingQty;
					totalRemainingCost += remainingQty * row.avgPrice;
				}
			}

			// If **all shares sold** (dormant), set all holding details to 0
			const isDormant = totalRemainingQty === 0;

			const avgPrice = isDormant
				? 0
				: Number((totalRemainingCost / totalRemainingQty).toFixed(2));
			const totalCostOfStock = isDormant
				? 0
				: parseFloat((totalRemainingQty * avgPrice).toFixed(2));
			const currVal = isDormant ? 0 : 20; // Replace with LTP*qty if you want
			const quantity = isDormant ? 0 : totalRemainingQty;

			stocksList.push({
				...stock.toObject(),
				quantity,
				avgPrice,
				totalCostOfStock,
				ltp: 20, // Placeholder
				currVal,
				pnl: 20, // Placeholder, or calculate realized P&L
				netChange: 20,
				dayChange: 20,
			});
		}

		res.json(stocksList);
	} catch (err) {
		console.error("Error fetching stocks:", err);
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

app.delete("/stocks/:id", authenticateJWT, async (req, res) => {
	try {
		const stockId = req.params.id;

		// Delete the stock itself
		await Stock.findByIdAndDelete(stockId);

		// Delete all history entries related to this stock
		await History.deleteMany({ stockId: stockId });

		console.log(`Deleted stock ${stockId} and its history`);
		res.status(200).json({ message: "Stock and related history deleted" });
	} catch (error) {
		console.error("Delete stock API error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
});

app.get("/history", authenticateJWT, async (req, res) => {
	try {
		const history = await History.find();
		res.json(history);
	} catch (error) {
		console.log("Error fetching history:", error);
	}
});

app.post("/history", authenticateJWT, async (req, res) => {
	const newHistory = req.body;
	const history = new History({
		stockId: new mongoose.Types.ObjectId(newHistory.stockId),
		...newHistory,
	});

	const stock = await Stock.findById(history.stockId);

	// ✅ Fetch only unsold shares (exclude fully sold rows)
	const activeHistoryRows = await History.find({
		stockId: stock._id,
		$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
	});

	let totalActiveQty = 0;
	let totalActiveCost = 0;

	activeHistoryRows.forEach((row) => {
		const unsoldQty = row.quantity - (row.quantitySold || 0);
		totalActiveQty += unsoldQty;
		totalActiveCost += unsoldQty * row.avgPrice;
	});

	// ✅ Add the new purchase
	totalActiveQty += history.quantity;
	totalActiveCost += history.quantity * history.avgPrice;

	// ✅ Update stock quantity
	stock.quantity = totalActiveQty < 0 ? 0 : totalActiveQty;

	// ✅ Update avgPrice
	stock.avgPrice = Number((totalActiveCost / totalActiveQty).toFixed(2));

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

			const pnl = parseFloat(
				(sellQty * (sellingPrice - row.avgPrice)).toFixed(2)
			);

			totalPnl += pnl;

			const prevTotalSellValue = (row.sellingPrice || 0) * alreadySold;
			const newTotalSellValue = prevTotalSellValue + sellingPrice * sellQty;
			const newQtySold = alreadySold + sellQty;
			const newAvgSellingPrice = newTotalSellValue / newQtySold;

			row.quantitySold = newQtySold;
			row.sellingPrice = newAvgSellingPrice;
			row.dateSold = dateSold;
			row.pnl = parseFloat(((row.pnl || 0) + pnl).toFixed(2));

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

app.listen(port, () => {
	console.log("Server running on port:", port);
});

//before google auth and prod env changes together
