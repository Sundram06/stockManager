import { useDispatch, useSelector } from "react-redux";
import { login, setAuthLoading } from "../store/auth-slice";
import { useEffect, useRef } from "react";

export default function useHydrateAuth() {
	const dispatch = useDispatch();
	const user = useSelector((s) => s.auth.user);
	const token = localStorage.getItem("token");
	const hasFetched = useRef(false);

	useEffect(() => {
		const API_URL = import.meta.env.VITE_API_URL;
		if (!user && token && !hasFetched.current) {
			dispatch(setAuthLoading(true));
			hasFetched.current = true;
			fetch(`${API_URL}/api/me`, {
				headers: { Authorization: `Bearer ${token}` },
			})
				.then((res) => res.json())
				.then((userProfile) => {
					dispatch(login({ user: userProfile, token }));
				})
				.catch(() => {
					localStorage.removeItem("token");
					dispatch(setAuthLoading(false));
				});
		} else if (!token) {
			dispatch(setAuthLoading(false));
		}
	}, [user, token, dispatch]);
}
