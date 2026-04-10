import {
	createStockForUser,
	deleteAllStocks,
	deleteStockById,
	listStocksForUser,
} from "../services/stock.service.mjs";

export const createStock = async (req, res) => {
	const payload = req.validated || req.body;
	const stock = await createStockForUser(req.userId, payload);
	if (stock?.error) {
		return res.status(stock.statusCode).json({ message: stock.error });
	}
	return res.json(stock);
};

export const listStocks = async (req, res) => {
	const stocks = await listStocksForUser(req.userId);
	return res.json(stocks);
};

export const removeAllStocks = async (req, res) => {
	await deleteAllStocks(req.userId);
	return res.status(204).send();
};

export const removeStock = async (req, res) => {
	await deleteStockById(req.userId, req.params.id);
	return res.status(200).json({ message: "Stock and related history deleted" });
};
