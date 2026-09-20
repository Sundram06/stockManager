import { FileFormatError } from "../file-format.mjs";
import * as vittnest from "./vittnest.parser.mjs";

// Every importable file becomes the same thing: a list of CanonicalTrade.
// Whatever the source, the rest of the pipeline (dedupe → simulate → preview →
// commit) sees only this shape.
//
//   CanonicalTrade = {
//     stockName,                      normalised symbol, e.g. "INFY"
//     instrumentKey?, isin?,
//     side: "BUY" | "SELL",
//     date: Date, quantity: number, price: number,
//     source: string,                 "VITTNEST", later "ZERODHA", …
//     externalTradeId?                the broker's own id, when the file has one
//   }
//
// A parser exports `claims(data)` to say it recognises a file, and `parse(data)`
// returning { source, exportedAt, trades }. Add a broker by writing one here and
// listing it below; nothing downstream changes.
const PARSERS = [vittnest];

/**
 * Parses file text into { source, exportedAt, trades }. Throws FileFormatError
 * with a message fit to show the user.
 */
export function parsePortfolioFile(content) {
	let data;
	try {
		data = JSON.parse(content);
	} catch {
		throw new FileFormatError(
			"This file isn't a VittNest backup (it isn't valid JSON). Broker files are coming soon.",
		);
	}

	const parser = PARSERS.find((p) => p.claims(data));
	if (!parser) {
		throw new FileFormatError("This file isn't a VittNest backup. Broker files are coming soon.");
	}
	return parser.parse(data);
}

export { FileFormatError };
