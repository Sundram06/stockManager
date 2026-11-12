import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useCompleteSignIn from "../hooks/useCompleteSignIn";
import { exchangeGoogleCode } from "../util/api/auth.mjs";

// The backend redirects here with a one-time code in the fragment
// (#code=...). Nothing is trusted from the URL itself: the code only becomes
// a session once the backend accepts it. Every exit navigates with replace,
// so the code never stays in the browser history.
export default function OAuthSuccessPage() {
	const navigate = useNavigate();
	const completeSignIn = useCompleteSignIn();
	// Effects run twice in development; the code is single-use.
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const failSignIn = () => navigate("/login?error=google", { replace: true });
		const code = new URLSearchParams(window.location.hash.slice(1)).get("code");
		if (!code) {
			failSignIn();
			return;
		}
		exchangeGoogleCode(code).then(completeSignIn, failSignIn);
	}, [completeSignIn, navigate]);

	return <div>Logging you in...</div>;
}
