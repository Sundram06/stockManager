import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, setAuthLoading } from "../store/auth-slice";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function OAuthSuccessPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const user = useSelector((s) => s.auth.user);
	const token = new URLSearchParams(window.location.search).get("token");

	useEffect(() => {
		if (token) {
			localStorage.setItem("token", token);
			localStorage.setItem("sessionActive", "active");
			dispatch(setAuthLoading(true));

			const decoded = jwtDecode(token);
			const fetchProfile = async () => {
				try {
					const res = await fetch("http://localhost:3000/api/me", {
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
			navigate("/login");
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
