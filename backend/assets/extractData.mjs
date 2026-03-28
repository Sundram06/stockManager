import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFilePath = path.resolve(__dirname, "./complete.json");
const outputFilePath = path.resolve(__dirname, "./instruments.json");
const FORCE = process.argv.includes("--force");

export async function extractData() {
	try {
		if (!fs.existsSync(inputFilePath)) {
			console.error(`Input file not found at: ${inputFilePath}`);
			return;
		}

		if (fs.existsSync(outputFilePath) && !FORCE) {
			console.log("instruments.json already exists. Use --force to overwrite.");
			return;
		}

		const fileData = fs.readFileSync(inputFilePath, "utf-8");
		const jsonData = JSON.parse(fileData);
		const items = Array.isArray(jsonData) ? jsonData : [];

		const extracted = items
			.filter((it) => {
				const instrumentType = it.instrument_type || it.instrumentType || it.type;
				const securityType = it.security_type || it.securityType || it.series || "";
				const isEq = (instrumentType || "").toUpperCase() === "EQ";
				const isNormal =
					securityType === "" ||
					securityType?.toUpperCase() === "NORMAL" ||
					securityType?.toUpperCase() === "EQ";
				return isEq && isNormal;
			})
			.map((it) => ({
				name:
					it.name ||
					it.tradingsymbol ||
					it.trading_symbol ||
					it.short_name ||
					"",
				short_name:
					it.short_name || it.tradingsymbol || it.trading_symbol || "",
				exchange: it.exchange || it.exch || "",
				trading_symbol: it.trading_symbol || it.tradingsymbol || "",
				instrument_key: it.instrument_key || it.instrumentKey || it.token || "",
			}));

		if (extracted.length === 0) {
			console.warn(
				"Warning: 0 instruments extracted. The schema might have changed or your filter is too strict.",
			);
		}

		fs.writeFileSync(outputFilePath, JSON.stringify(extracted, null, 2));
		console.log(
			`Extraction complete! Wrote ${extracted.length} records to ${outputFilePath}`,
		);
	} catch (err) {
		console.error("Error:", err);
	}
}

const isDirectRun =
	process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
	extractData();
}
