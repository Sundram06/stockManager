import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

const initialState = {
	user: null,
	token: null,
	logoutMessage: null,
	sessionActive: null,
	isAuthLoading: true,
};

const storedToken = localStorage.getItem("token");
if (storedToken) {
	try {
		const decoded = jwtDecode(storedToken);
		const currentTime = Math.floor(Date.now() / 1000);
		if (decoded.exp > currentTime) {
			initialState.token = storedToken;
			initialState.sessionActive = "active";
		} else {
			localStorage.removeItem("token");
		}
	} catch (err) {
		localStorage.removeItem("token");
	}
}

const authSlice = createSlice({
	name: "auth",
	initialState,
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
			// Accept either {user, token} or user (for compatibility)
			if (action.payload.user && action.payload.token) {
				state.user = action.payload.user;
				state.token = action.payload.token;
			} else {
				state.user = action.payload;
			}
			state.logoutMessage = null;
			state.sessionActive = "active";
			state.isAuthLoading = false; // <-- Ensure loading is false after login
		},
		logout(state, action) {
			state.user = null;
			state.token = null;
			state.logoutMessage = action.payload?.message || "Logged out";
			state.sessionActive = action.payload?.sessionActive || "loggedout";
			state.isAuthLoading = false; // <-- Ensure loading is false after logout
		},
		clearLogoutMessage: (state) => {
			state.logoutMessage = null;
		},
		setAuthLoading: (state, action) => {
			state.isAuthLoading = action.payload;
		},
	},
});

export const {
	setAuth,
	clearAuth,
	login,
	logout,
	clearLogoutMessage,
	setAuthLoading,
} = authSlice.actions;
export default authSlice;
