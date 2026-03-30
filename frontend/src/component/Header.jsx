import { BarChart2, LogOut, Sun, Moon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/auth-slice";
import { logoutUser } from "../util/api/auth.mjs";
import { useTheme } from "../theme/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getFirstName(userInfo) {
  if (!userInfo) return "User";
  if (userInfo.name?.trim()) return userInfo.name.trim().split(/\s+/)[0];
  if (userInfo.email?.includes("@")) return userInfo.email.split("@")[0];
  return "User";
}

export default function Header() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logoutUser();
    dispatch(logout({ sessionActive: "loggedout" }));
    navigate("/login");
  };

  return (
    <header className="w-full border-b border-border bg-sidebar shadow-sm">
      <div className="flex items-center justify-between px-3 sm:px-5 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <span className="font-bold text-base sm:text-lg tracking-tight text-foreground">
            VittNest
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-3">
          {user && (
            <span className="hidden sm:block text-sm text-muted-foreground">
              Welcome, {getFirstName(user)}!
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={cn("h-8 w-8 sm:h-9 sm:w-9")}
          >
            {mode === "dark" ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
