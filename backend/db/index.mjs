import { User, History, Stock } from "./model.mjs";

export const createUser = async (userData) => {
	const user = new User(userData);
	return await user.save();
};

export const getUser = async (id) => {
	return await User.findById(id);
};

export const updateUser = async (id, updateData) => {
	return await User.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteUser = async (id) => {
	return await User.findByIdAndDelete(id);
};

export const createStock = async (stockData) => {
	const stock = new Stock(stockData);
	return await stock.save();
};

export const getStock = async (id) => {
	return await Stock.findById(id);
};

export const updateStock = async (id, updateData) => {
	return await Stock.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteStock = async (id) => {
	return await Stock.findByIdAndDelete(id);
};

export const createHistory = async (historyData) => {
	const history = new History(historyData);
	return await history.save();
};

export const getHistory = async (id) => {
	return await History.findById(id);
};

export const updateHistory = async (id, updateData) => {
	return await History.findByIdAndUpdate(id, updateData, { new: true });
};

export const deleteHistory = async (id) => {
	return await History.findByIdAndDelete(id);
};
