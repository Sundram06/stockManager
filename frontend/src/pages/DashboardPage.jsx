import { useSelector } from "react-redux";
import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioTable from "../component/PortfolioTable";
import PortfolioHeader from "../component/PortfolioHeader";
import PortfolioSummary from "../component/PortfolioSummary";
import useMarketData from "../hooks/useMarketData";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useScrollTrigger } from "../hooks/useScrollTrigger";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useSelector((s) => s.auth.user);
  const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [addOpen, setAddOpen] = useState(false);
  const { ltpMap, isConnected } = useMarketData();

  const isMobile = useMediaQuery("(max-width: 599px)");
  const scrolled = useScrollTrigger(60);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-1 justify-center items-center h-screen flex-col gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-base text-muted-foreground">Loading your portfolio...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-1 justify-center items-center h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleAddStock = () => setAddOpen(true);

  return (
    <div className="mx-auto py-4 sm:py-8 px-3 sm:px-4 w-full">
      <PortfolioHeader
        search={search}
        onSearchChange={setSearch}
        tab={tab}
        onTabChange={setTab}
        onAddStock={handleAddStock}
        username={user?.name?.split(" ")[0]}
      >
        <PortfolioSummary ltpMap={ltpMap} />
      </PortfolioHeader>
      <PortfolioTable
        activeTab={tab}
        search={deferredSearch}
        addOpen={addOpen}
        setAddOpen={setAddOpen}
        ltpMap={ltpMap}
        isConnected={isConnected}
      />

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={handleAddStock}
          aria-label="Add stock"
          className={cn(
            "fixed bottom-6 right-5 z-[1200] flex items-center justify-center",
            "bg-primary text-primary-foreground shadow-xl font-bold text-sm",
            "transition-[width,border-radius,padding] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            scrolled
              ? "h-14 w-14 rounded-full px-0"
              : "h-14 rounded-full px-5 w-auto"
          )}
          style={{ transitionProperty: "width, border-radius, padding" }}
        >
          <Plus
            className="shrink-0"
            style={{ width: "1.1rem", height: "1.1rem" }}
          />
          <span
            className={cn(
              "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin]",
              "duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]",
              scrolled ? "max-w-0 opacity-0 ml-0" : "max-w-[100px] opacity-100 ml-2"
            )}
          >
            Add Stock
          </span>
        </button>
      )}
    </div>
  );
}
