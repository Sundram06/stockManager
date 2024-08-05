import { configureStore } from "@reduxjs/toolkit";
import stocksSlice from "./stocks-slice";
import authSlice from "./auth-slice";

const store = configureStore({
	reducer: { stocks: stocksSlice.reducer, auth: authSlice.reducer },
});

export default store;
