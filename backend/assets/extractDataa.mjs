import * as fs from "fs/promises";

const inputFilePath = "./assets/complete.json";
const outputFilePath = "./instruments.json";

export async function extractData() {
	try {
		// Read the entire file into memory
		const fileData = await fs.readFile(inputFilePath, "utf-8");

		// Parse the JSON data
		const jsonData = JSON.parse(fileData);

		// Extract the fields you need
		const extractedData = jsonData
			.filter(
				(item) =>
					item.instrument_type === "EQ" && item.security_type === "NORMAL"
			)
			.map((item) => ({
				name: item.name,
				short_name: item.short_name,
				exchange: item.exchange,
				// Add more fields as needed
			}));

		// Write the extracted data to a new file
		await fs.writeFile(outputFilePath, JSON.stringify(extractedData, null, 2));

		console.log("Extraction complete!");
	} catch (err) {
		console.error("Error:", err);
	}
}
