import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setAuthLoading } from "../store/auth-slice";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { API_URL } from "../util/api/config.mjs";

export default function OAuthSuccessPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((s) => s.auth.user);
	// Capture the token ONCE, at mount. Reading window.location.search on every
	// render is a bug: as soon as we navigate to /dashboard the query string is
	// gone, this component re-renders with token === null before it unmounts,
	// and the effect below re-runs into its `else` branch and bounces the user
	// to /login — undoing the successful login.
	const [token] = useState(() =>
		new URLSearchParams(window.location.search).get("token"),
	);
	const hasHandledToken = useRef(false);

	useEffect(() => {
		if (hasHandledToken.current) return;
		hasHandledToken.current = true;

		if (token) {
			localStorage.setItem("token", token);
			localStorage.setItem("sessionActive", "active");
			dispatch(setAuthLoading(true));

			const decoded = jwtDecode(token);
			const fetchProfile = async () => {
				try {
					const res = await fetch(`${API_URL}/api/me`, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!res.ok) throw new Error("Failed to fetch user");
					const userProfile = await res.json();
					dispatch(login({ user: userProfile, token }));
					dispatch(setAuthLoading(false));
				} catch (error) {
					dispatch(login({ user: { _id: decoded.userId }, token }));
					dispatch(setAuthLoading(false));
				}
			};
			fetchProfile();
		} else {
			navigate("/login", { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dispatch, token, navigate]);

	useEffect(() => {
		if (user && token) {
			navigate("/dashboard", { replace: true });
		}
	}, [user, token, navigate]);

	return <div>Logging you in...</div>;
}
