import { createSlice } from "@reduxjs/toolkit";

const stocksSlice = createSlice({
	name: "stocks",
	initialState: [],
	reducers: {
		addStockToPortfolio: (state, action) => {
			state.push(action.payload);
		},
		removeStockFromPortfolio: () => {},
		editStockInPortfolio: () => {},
	},
});

export const { addStockToPortfolio } = stocksSlice.actions;
export default stocksSlice;
