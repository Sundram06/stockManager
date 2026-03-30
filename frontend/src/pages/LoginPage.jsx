import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { login, clearLogoutMessage } from "../store/auth-slice";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../util/api/auth.mjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sessionActive = useSelector((state) => state.auth.sessionActive);
  const logoutMessage = useSelector((state) => state.auth.logoutMessage);

  useEffect(() => {
    if (logoutMessage) {
      const justLoggedOut = sessionStorage.getItem("justLoggedOut");
      if (justLoggedOut) {
        sessionStorage.removeItem("justLoggedOut");
      } else {
        dispatch(clearLogoutMessage());
      }
    }
  }, [dispatch, logoutMessage]);

  const { mutate } = useMutation({
    mutationKey: ["login"],
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("sessionActive", true);
      dispatch(login(data.user));
      navigate("/dashboard");
    },
    onError: (error) => {
      console.error("Login failed:", error);
      alert("Login failed, please try again.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    mutate(Object.fromEntries(data));
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-md p-8">
        {logoutMessage && (
          <p className="text-sm text-destructive text-center mb-4">
            {sessionActive === "expired"
              ? "Session expired. Please login again."
              : "Logged out."}
          </p>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-center mb-5">Sign In</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="mt-1 w-full">
            Sign In
          </Button>

          <div className="flex flex-col gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { window.location.href = `${API_URL}/api/auth/google`; }}
            >
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { window.location.href = `${API_URL}/api/upstox/login`; }}
            >
              Continue with Upstox
            </Button>
          </div>
        </form>

        <div className="flex justify-between mt-5 text-sm">
          <Link
            to={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Forgot password?
          </Link>
          <Link
            to="/register"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Don&apos;t have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}
