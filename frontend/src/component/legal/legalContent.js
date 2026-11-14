// Plain-language policies. They describe what the code does today; update
// them in the same change as any feature that collects or shares new data.

export const PRIVACY = {
	title: "Privacy",
	updated: "14 November 2026",
	intro:
		"VittNest is a portfolio tracker. This page explains what it stores about you, why, and who else is involved. If anything here is unclear, write to us through the contact page.",
	sections: [
		{
			heading: "What we store",
			items: [
				"Your name and email address.",
				"Your password, stored only as a one-way hash. We cannot read it.",
				"If you sign in with Google: your Google account ID, name and email address. We do not get access to your Gmail, contacts or files.",
				"The trades you add or import: stock, date, quantity and price, plus the trade and order IDs from a broker file.",
				"A record of each import, kept so you can undo it.",
			],
		},
		{
			heading: "What we never ask for",
			paragraphs: [
				"Your broker login, your bank details, your PAN or any payment information. VittNest cannot place orders or move money.",
			],
		},
		{
			heading: "Why we store it",
			paragraphs: [
				"Only to run your account: to sign you in, to calculate your positions and profit and loss, and to email you about your account (verification and password reset). We do not sell your data, show ads, or use analytics or tracking tools.",
			],
		},
		{
			heading: "Your browser",
			items: [
				"Your sign-in token and your light or dark theme choice are kept in your browser's local storage. The token expires after 10 hours.",
				"Signing in with Google sets one short-lived cookie that checks the sign-in started in your browser. It is removed when sign-in completes.",
			],
		},
		{
			heading: "Services we rely on",
			items: [
				"MongoDB Atlas stores the database.",
				"Render hosts the application.",
				"Google provides Google sign-in, sends our emails through Gmail, and serves the site's fonts (Google Fonts), which means your browser contacts Google when a page loads.",
				"Upstox provides market prices. We ask it for prices of stocks; we never send it anything about you.",
			],
		},
		{
			heading: "Messages you send us",
			paragraphs: [
				"The contact form emails your name, email address and message to us so we can reply. We do not add them to your account.",
			],
		},
		{
			heading: "Keeping and deleting your data",
			paragraphs: [
				"Your data is kept while you have an account. You can download a full backup or CSV export at any time from your dashboard.",
				"To delete your account and everything in it, write to us through the contact page from the email address on the account. There is no self-service delete button yet.",
			],
		},
		{
			heading: "Changes",
			paragraphs: ["If this policy changes, the date at the top of this page changes with it."],
		},
	],
};

export const TERMS = {
	title: "Terms",
	updated: "14 November 2026",
	intro:
		"These terms apply when you use VittNest. They are written to be read. If you have a question, write to us through the contact page.",
	sections: [
		{
			heading: "What VittNest is",
			paragraphs: [
				"VittNest is a free tool for keeping a record of your stock trades and following their value. It is not investment, tax or financial advice, and it is not a broker.",
			],
		},
		{
			heading: "Accuracy",
			items: [
				"Your positions and profit and loss are calculated from the trades you add or import. If a trade is wrong or missing, the results will be too.",
				"Profit and loss is calculated before brokerage, STT and other charges, and does not adjust for stock splits or bonus issues yet.",
				"Prices come from Upstox and may be delayed or briefly unavailable.",
				"Check anything important against your broker's contract notes and statements before acting on it.",
			],
		},
		{
			heading: "Your account",
			items: [
				"Give a real email address and keep your password to yourself.",
				"Do not use VittNest to access other people's data, to overload or attack the service, or to collect data from it automatically.",
				"Your trade data is yours. You can export it at any time.",
			],
		},
		{
			heading: "The service",
			paragraphs: [
				"VittNest is provided as it is, without guarantees. We may change features or stop the service; if we stop it, we will try to give notice so you can export your data first.",
				"To the extent the law allows, we are not liable for losses arising from using VittNest or from relying on its numbers.",
			],
		},
		{
			heading: "Changes",
			paragraphs: ["If these terms change, the date at the top of this page changes with them."],
		},
	],
};
