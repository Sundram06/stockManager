/* eslint-disable react/prop-types */
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PortfolioHeader({
  search,
  onSearchChange,
  tab,
  onTabChange,
  onAddStock,
  username,
  children,
}) {
  return (
    <>
      {/* Title + Add Stock button */}
      <div className="flex items-center justify-between gap-2 mb-3 min-h-[44px] sm:min-h-auto">
        <h1 className="font-bold leading-tight text-[1.2rem] sm:text-[1.6rem] tracking-tight text-foreground">
          {username ? `${username}'s Portfolio` : "My Portfolio"}
        </h1>
        <Button
          onClick={onAddStock}
          className="hidden sm:inline-flex gap-1.5 px-3 py-1.5 text-sm"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Stock
        </Button>
      </div>

      <Separator className="mb-4" />

      {children}

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a stock"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card text-sm sm:text-base"
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={String(tab)}
        onValueChange={(v) => onTabChange(Number(v))}
        className="mb-4"
      >
        <TabsList className="h-9 sm:h-11">
          <TabsTrigger value="0" className="text-xs sm:text-sm px-3 sm:px-5">
            Active Stocks
          </TabsTrigger>
          <TabsTrigger value="1" className="text-xs sm:text-sm px-3 sm:px-5">
            Dormant Stocks
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </>
  );
}
