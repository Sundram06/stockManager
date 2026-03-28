import {
	createHistory,
	listHistoryForUser,
	sellHistory,
} from "../services/history.service.mjs";

export const getHistory = async (req, res) => {
	const history = await listHistoryForUser(req.userId);
	return res.json(history);
};

export const addHistory = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await createHistory(req.userId, payload);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error });
	}
	return res.json(result);
};

export const sellHistoryStock = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await sellHistory(req.userId, payload);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error });
	}
	return res.status(200).json(result);
};
