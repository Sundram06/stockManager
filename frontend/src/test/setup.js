import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has neither of these, and MUI's responsive components need matchMedia.
window.matchMedia = window.matchMedia || ((query) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn(),
}));

window.scrollTo = window.scrollTo || vi.fn();

afterEach(() => {
	cleanup();
	localStorage.clear();
});
