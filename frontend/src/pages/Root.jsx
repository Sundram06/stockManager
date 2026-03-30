import Header from "../component/Header";
import { Outlet, useLocation } from "react-router-dom";
import useHydrateAuth from "../hooks/useHydrateAuth";
import { useSelector } from "react-redux";

export default function RootLayout() {
  useHydrateAuth();
  const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
  const location = useLocation();
  const isLoginOrRegister = ["/login", "/register", "/forgot-password"].includes(
    location.pathname
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 flex flex-col bg-background">
        {isAuthLoading && !isLoginOrRegister ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
