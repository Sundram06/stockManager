import * as fs from "fs";

const inputFilePath = "./assets/complete.json";
const outputFilePath = "./instruments.json";

export async function extractData() {
	try {
		if (!outputFilePath) {
			const fileData = fs.readFileSync(inputFilePath, "utf-8");
			const jsonData = JSON.parse(fileData);

			const extractedData = jsonData
				.filter(
					(item) =>
						item.instrument_type === "EQ" && item.security_type === "NORMAL"
				)
				.map((item) => ({
					name: item.name,
					short_name: item.short_name,
					exchange: item.exchange,
					trading_symbol: item.trading_symbol,
				}));

			fs.writeFileSync(outputFilePath, JSON.stringify(extractedData, null, 2));

			console.log("Extraction complete!");
		} else {
			console.log("File already exists. Skipping extraction.");
		}
	} catch (err) {
		console.error("Error:", err);
	}
}
