import { FileFormatError } from "../file-format.mjs";
import * as vittnest from "./vittnest.parser.mjs";
import * as zerodha from "./zerodha.parser.mjs";

// Every importable file becomes the same thing: a list of CanonicalTrade.
// Whatever the source, the rest of the pipeline (dedupe, simulate, preview,
// commit) sees only this shape.
//
//   CanonicalTrade = {
//     stockName,                      normalised symbol, e.g. "INFY"
//     isin?, exchange?, instrumentKey?,
//     side: "BUY" | "SELL",
//     date: Date, quantity: number, price: number,
//     source: "VITTNEST" | "ZERODHA",
//     externalTradeId?,               the broker's own id
//     externalOrderId?,               fills of one order share this
//     isEstimatedDate?                true when the file gave a day, not a time
//   }
//
// A parser exports claims(content) to say it recognises the raw file text, and
// parse(content) returning { source, exportedAt, trades, matching }. `matching`
// is "exact" when the file came from this app and timestamps line up, or "day"
// for a broker file, where the same trade typed in by hand sits at midnight
// with a rounded price.
const PARSERS = [vittnest, zerodha];

export function parsePortfolioFile(content) {
	const parser = PARSERS.find((p) => p.claims(content));
	if (!parser) {
		throw new FileFormatError(
			"This file isn't a VittNest backup or a Zerodha tradebook. Download the tradebook from Zerodha Console as CSV, or use a backup file from Import / Export.",
		);
	}
	return parser.parse(content);
}

export { FileFormatError };
