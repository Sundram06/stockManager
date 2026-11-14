import { describe, expect, it } from "vitest";
import { escapeHtml } from "../../src/utils/html.mjs";

describe("escapeHtml", () => {
	it("neutralises markup and quotes", () => {
		expect(escapeHtml(`<img src=x onerror="alert('x')"> & co`)).toBe(
			"&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt; &amp; co",
		);
	});

	it("leaves plain text alone", () => {
		expect(escapeHtml("Buy 10 INFY @ 1500")).toBe("Buy 10 INFY @ 1500");
	});
});
