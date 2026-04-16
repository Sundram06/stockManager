import { useEffect, useRef, useState } from "react";
import { API_URL } from "../util/api/config.mjs";

const BACKOFF_DELAYS = [1000, 5000, 10000, 30000, 60000];

// Converts http(s):// → ws(s)://
const toWsUrl = (baseUrl) => {
	const ws = baseUrl.replace(/^http/, "ws");
	return `${ws}/ws/market-data`;
};

export default function useMarketData() {
	const [ltpMap, setLtpMap] = useState({}); // { stockName: { ltp, cp } }
	const [isConnected, setIsConnected] = useState(false);
	const wsRef = useRef(null);
	const attemptsRef = useRef(0);
	const timerRef = useRef(null);
	const unmountedRef = useRef(false);

	useEffect(() => {
		unmountedRef.current = false;

		const connect = () => {
			const token = localStorage.getItem("token");
			if (!token || !API_URL) return;

			const url = toWsUrl(API_URL);
			const ws = new window.WebSocket(url);
			wsRef.current = ws;

			ws.onopen = () => {
				if (unmountedRef.current) return ws.close();
				// Send token as first message — keeps JWT out of URLs and server logs
				ws.send(JSON.stringify({ type: "auth", token }));
				setIsConnected(true);
				attemptsRef.current = 0;
			};

			ws.onmessage = (event) => {
				if (unmountedRef.current) return;
				try {
					const msg = JSON.parse(event.data);
					if (msg.type === "snapshot" || msg.type === "ltp_update") {
						setLtpMap((prev) => ({ ...prev, ...msg.feeds }));
					}
				} catch {
					// ignore malformed messages
				}
			};

			ws.onclose = () => {
				if (unmountedRef.current) return;
				setIsConnected(false);
				wsRef.current = null;
				const delay =
					BACKOFF_DELAYS[Math.min(attemptsRef.current, BACKOFF_DELAYS.length - 1)];
				attemptsRef.current++;
				timerRef.current = setTimeout(connect, delay);
			};

			ws.onerror = () => {
				ws.close();
			};
		};

		connect();

		return () => {
			unmountedRef.current = true;
			clearTimeout(timerRef.current);
			wsRef.current?.close(1000);
		};
	}, []);

	return { ltpMap, isConnected };
}
