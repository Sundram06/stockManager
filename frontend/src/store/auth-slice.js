import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: null,
		token: null,
		logoutMessage: null,
	},
	reducers: {
		setAuth: (state, action) => {
			state.user = action.payload.user;
			state.token = action.payload.token;
		},
		clearAuth: (state) => {
			state.user = null;
			state.token = null;
			state.logoutMessage = null;
		},
		login: (state, action) => {
			state.user = action.payload.user;
			state.token = action.payload.token;
			state.logoutMessage = null;
		},
		logout(state, action) {
			state.user = null;
			state.isAuthenticated = false;
			state.logoutMessage = action.payload?.message || "Logged out";
		},
	},
});

export const { setAuth, clearAuth, login, logout } = authSlice.actions;
export default authSlice;
