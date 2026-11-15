import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { login } from "../store/auth-slice";
import { preloadDashboard } from "../util/preloadDashboard.mjs";

/**
 * Finishes any sign-in (password or Google): stores the session token, puts
 * the user in Redux and opens the dashboard. The current history entry is
 * replaced, so Back does not return to the sign-in step. The dashboard's code
 * and data start loading at the same moment as the navigation.
 */
export default function useCompleteSignIn() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useCallback(
		({ user, token }) => {
			localStorage.setItem("token", token);
			localStorage.setItem("sessionActive", "active");
			dispatch(login({ user, token }));
			preloadDashboard(queryClient);
			navigate("/dashboard", { replace: true });
		},
		[dispatch, navigate, queryClient],
	);
}
