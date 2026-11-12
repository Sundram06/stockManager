import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../store/auth-slice";

/**
 * Finishes any sign-in (password or Google): stores the session token, puts
 * the user in Redux and opens the dashboard. The current history entry is
 * replaced, so Back does not return to the sign-in step.
 */
export default function useCompleteSignIn() {
	const dispatch = useDispatch();
	const navigate = useNavigate();

	return useCallback(
		({ user, token }) => {
			localStorage.setItem("token", token);
			localStorage.setItem("sessionActive", "active");
			dispatch(login({ user, token }));
			navigate("/dashboard", { replace: true });
		},
		[dispatch, navigate],
	);
}
