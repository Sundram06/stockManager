import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import SaveAltOutlinedIcon from "@mui/icons-material/SaveAltOutlined";

// Every statement here must stay true of the app as it ships. Check this file
// whenever a feature changes or is removed.

export const HERO = {
	titleStart: "Know what every share",
	titleAccent: "really",
	titleEnd: "cost you.",
	subtitle:
		"A free portfolio tracker for Indian stock investors. VittNest matches every sale to your oldest shares first (FIFO), shows live NSE prices, and keeps a lot-by-lot record of every buy and sell.",
	trustLine: "No broker login. VittNest can't place orders or move your money.",
};

// One worked example: two buys at different prices, then a partial sell.
export const FIFO_EXAMPLE = {
	trades: [
		{ side: "Buy", when: "January", quantity: 10, price: 1000 },
		{ side: "Buy", when: "June", quantity: 10, price: 1500 },
		{ side: "Sell", when: "October", quantity: 10, price: 1600 },
	],
};

export const FEATURES = [
	{
		icon: LayersOutlinedIcon,
		title: "FIFO lots",
		body: "Every sale is matched to your oldest shares first. See which lots are sold, which you still hold, and what each one cost.",
	},
	{
		icon: BoltOutlinedIcon,
		title: "Live prices",
		body: "NSE prices from Upstox during market hours, and the last traded price after the close. Your unrealised P&L moves with them.",
	},
	{
		icon: UploadFileOutlinedIcon,
		title: "Import from Zerodha",
		body: "Upload your Zerodha tradebook. Trades you already typed in are matched, you see a preview before anything changes, and you can undo for 7 days.",
	},
	{
		icon: ShowChartOutlinedIcon,
		title: "Price chart with your trades",
		body: "Up to five years of daily prices for each stock, with your buys and sells marked on the chart.",
	},
	{
		icon: TaskAltOutlinedIcon,
		title: "Exited positions",
		body: "Stocks you have fully sold stay on record with realised P&L and your average buy and sell prices.",
	},
	{
		icon: SaveAltOutlinedIcon,
		title: "Backup and export",
		body: "Download a backup that restores your portfolio exactly, or holdings and transactions as CSV files for Excel.",
	},
];

export const STEPS = [
	{ title: "Create a free account", body: "Sign up with your email or with Google." },
	{ title: "Add your trades", body: "Type in each buy and sell, or import your Zerodha tradebook." },
	{ title: "See where you stand", body: "Current value, FIFO cost and realised P&L for every stock, with live prices." },
];

export const DATA_POINTS = [
	{
		title: "What we store",
		body: "Your name, your email, and the trades you add or import. Passwords are stored only as a secure hash.",
	},
	{
		title: "What we never ask for",
		body: "Your broker login, your bank details or your PAN. VittNest has no way to trade or move money.",
	},
	{
		title: "Take it with you",
		body: "Download a full backup or CSV export of your portfolio at any time.",
	},
];

export const FAQS = [
	{
		question: "Is VittNest free?",
		answer: "Yes. There is no paid plan, and you don't need a card to sign up.",
	},
	{
		question: "Does it connect to my broker account?",
		answer:
			"No. You add trades yourself or upload a tradebook file. VittNest only reads market prices from Upstox; it never sees your broker account and cannot place orders.",
	},
	{
		question: "Does it calculate my tax?",
		answer:
			"No. VittNest shows profit and loss for your records, not a tax report. P&L is calculated before brokerage, STT and other charges, so it will differ slightly from your contract notes.",
	},
	{
		question: "Which stocks does it support?",
		answer: "Equity shares listed on NSE. Mutual funds, F&O and US stocks are not supported.",
	},
	{
		question: "Which brokers can I import from?",
		answer: "Zerodha, using the tradebook CSV from Console. For any other broker, add your trades by hand.",
	},
	{
		question: "What happens after a stock split or bonus issue?",
		answer:
			"Splits and bonuses are not adjusted automatically yet, so quantities and average prices for an affected stock won't match your broker until this is added.",
	},
	{
		question: "What does FIFO mean here?",
		answer:
			"First in, first out. When you sell, the shares you bought earliest are counted as sold first. Buys made on the same day are treated as one pool and shared proportionally.",
	},
];

export const FINAL_CTA = {
	title: "Start your ledger.",
	accent: "It's free.",
	body: "Add your first trade by hand, or import your Zerodha tradebook.",
};
