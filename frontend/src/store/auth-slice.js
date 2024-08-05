import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
	name: "auth",
	initialState: {
		user: null,
		token: null,
	},
	reducers: {
		setAuth: (state, action) => {
			state.user = action.payload.user;
			state.token = action.payload.token;
		},
		clearAuth: (state) => {
			state.user = null;
			state.token = null;
		},
		login: (state, action) => {
			state.user = action.payload.user;
			state.token = action.payload.token;
		},
		logout(state) {
			state.user = null;
			state.isAuthenticated = false;
		},
	},
});

export const { setAuth, clearAuth, login, logout } = authSlice.actions;
export default authSlice;
