import { createSlice } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";

const initialState = {
	user: null,
	token: null,
	logoutMessage: null,
	sessionActive: null,
};

// Attempt to restore token from localStorage
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
			state.user = action.payload.user;
			state.token = action.payload.token;
			state.logoutMessage = null;
			state.sessionActive = action.payload?.sessionActive || "active";
		},
		logout(state, action) {
			state.user = null;
			state.token = null;
			state.logoutMessage = action.payload?.message || "Logged out";
			state.sessionActive = action.payload?.sessionActive || "loggedout";
		},
	},
});

export const { setAuth, clearAuth, login, logout } = authSlice.actions;
export default authSlice;
