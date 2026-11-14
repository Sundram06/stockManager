import { lazy } from "react";

const RELOADED_AT_KEY = "vittnest-stale-chunk-reload-at";
const RETRY_WINDOW_MS = 10_000;

// After a deploy, an open tab still asks for the old hashed chunk files, which
// no longer exist. One reload picks up the new index.html. The timestamp stops a
// reload loop when the chunk is missing for some other reason, such as a host
// still serving a cached index.
export function shouldReload({ storage, now, online }) {
	if (!online) return false;
	try {
		const last = Number(storage.getItem(RELOADED_AT_KEY));
		if (last && now - last < RETRY_WINDOW_MS) return false;
		storage.setItem(RELOADED_AT_KEY, String(now));
		return true;
	} catch {
		return false;
	}
}

// While the reload is under way the import is left pending instead of
// rejected. A rejection would reach the router's error page and flash it.
export function loadOrReload(load, win = window) {
	return load().catch((err) => {
		const reload = shouldReload({
			storage: win.sessionStorage,
			now: Date.now(),
			online: win.navigator.onLine !== false,
		});
		if (!reload) throw err;
		win.location.reload();
		return new Promise(() => {});
	});
}

export function lazyWithReload(load) {
	return lazy(() => loadOrReload(load));
}
