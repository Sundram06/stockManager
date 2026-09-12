import { useDispatch, useSelector } from "react-redux";
import { login, setAuthLoading } from "../store/auth-slice";
import { expireSession } from "../util/api/session.mjs";
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
				.then(async (res) => {
					if (res.ok) {
						dispatch(login({ user: await res.json(), token }));
						return;
					}

					// The server rejected the token itself, or the account is
					// gone. That is a real dead session, so end it.
					if (res.status === 401 || res.status === 403 || res.status === 404) {
						expireSession();
						return;
					}

					// Anything else (5xx, proxy error) is the server having a bad
					// moment, not proof the token is bad. Keep it and allow a
					// retry rather than logging a valid user out.
					hasFetched.current = false;
					dispatch(setAuthLoading(false));
				})
				.catch(() => {
					// Network failure — backend down, offline, DNS. Same reasoning:
					// never discard a possibly-valid token over a transient error.
					hasFetched.current = false;
					dispatch(setAuthLoading(false));
				});
		} else if (!token) {
			dispatch(setAuthLoading(false));
		}
	}, [user, token, dispatch]);
}
