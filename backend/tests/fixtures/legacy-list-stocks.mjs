// Frozen copy of listStocksForUser before it was batched (one History query
// per stock). It is the oracle the batched version must match exactly.
import mongoose from "mongoose";

export async function legacyListStocksForUser({ Stock, History }, userId) {
	const userObjectId = new mongoose.Types.ObjectId(userId);
	const stocks = await Stock.find({ userId: userObjectId });
	const stocksList = [];

	for (const stock of stocks) {
		const historyRows = await History.find({ stockId: stock._id }).sort({ date: 1 });

		let totalRemainingQty = 0;
		let totalRemainingCost = 0;

		for (const row of historyRows) {
			const quantitySold = row.quantitySold || 0;
			const remainingQty = row.quantity - quantitySold;
			if (remainingQty > 0) {
				totalRemainingQty += remainingQty;
				totalRemainingCost += remainingQty * row.avgPrice;
			}
		}

		const isDormant = totalRemainingQty === 0;
		const avgPrice = isDormant ? 0 : Number((totalRemainingCost / totalRemainingQty).toFixed(2));
		const totalCostOfStock = isDormant ? 0 : parseFloat((totalRemainingQty * avgPrice).toFixed(2));
		const quantity = isDormant ? 0 : totalRemainingQty;

		stocksList.push({ ...stock.toObject(), quantity, avgPrice, totalCostOfStock });
	}

	return stocksList;
}
