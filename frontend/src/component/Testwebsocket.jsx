import { useEffect, useState } from "react";
import marketdatafeed from "./MarketDataFeed.json";
import uuid from "uuid4";
import { WebSocket } from "ws";

// Function to get WebSocket URL
const getUrl = async (token) => {
	const apiUrl = "https://api-v2.upstox.com/feed/market-data-feed/authorize";
	let headers = {
		"Content-type": "application/json",
		Authorization: "Bearer " + token,
	};
	const response = await fetch(apiUrl, {
		method: "GET",
		headers: headers,
	});
	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	const res = await response.json();
	// console.log(res.data);
	return res.data.authorizedRedirectUri;
};

// MarketDataFeed component
// eslint-disable-next-line react/prop-types
function MarketDataFeed({ token }) {
	const [isConnected, setIsConnected] = useState(false);
	const [feedData, setFeedData] = useState([]);

	// Establish WebSocket connection
	useEffect(() => {
		const connectWebSocket = async (token) => {
			try {
				const wsUrl = await getUrl(token);
				const ws = new WebSocket(wsUrl);
				console.log(wsUrl);
				ws.onopen = () => {
					setIsConnected(true);
					console.log("Connected");
					const data = {
						guid: uuid(),
						method: "sub",
						data: {
							mode: "full",
							instrumentKeys: ["NSE_EQ|INE399C01030"],
						},
					};
					ws.send(JSON.stringify(data));
				};

				ws.onclose = () => {
					setIsConnected(false);
					console.log("Disconnected");
				};

				ws.onmessage = () => {
					console.log("received response ", marketdatafeed);
					// Use the imported JSON data directly
					const response = marketdatafeed;
					setFeedData((currentData) => [
						...currentData,
						JSON.stringify(response, null, 2), // Pretty-print JSON
					]);
				};

				ws.onerror = (error) => {
					setIsConnected(false);
					console.log("WebSocket error:", error);
				};

				return () => ws.close();
			} catch (error) {
				console.error("WebSocket connection error:", error);
			}
		};

		connectWebSocket(token);
	}, [token]);

	const handleDataSend = () => {
		ws.send(JSON.stringify(data));
	};

	return (
		<div className="feed-container">
			<h1> Market Feed </h1>
			<div className="header-section">
				<h1>Market Feed</h1>
				<h3 className={`status ${isConnected ? "connected" : "not-connected"}`}>
					Status: <span>{isConnected ? "Connected" : "Not Connected"}</span>
				</h3>
			</div>
			<div>
				<button onClick={() => handleDataSend()}>Send data</button>
			</div>
			{isConnected && (
				<div className="feed-section">
					<div className="title">Feed</div>
					<div>
						{feedData.map((data, index) => (
							<div key={index} className="feed-item">
								{data}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export default MarketDataFeed;
