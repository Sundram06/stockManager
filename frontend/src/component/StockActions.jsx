/* eslint-disable react/prop-types */
import { Plus, Minus, BarChart2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StockActions({ onAdd, onSell, onViewHistory, onDelete, canSell }) {
  return (
    <div className="flex items-center gap-0.5">
      <Button variant="ghost" size="icon" onClick={onAdd} title="Add" className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10">
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={canSell ? onSell : undefined}
        title="Sell"
        disabled={!canSell}
        className="h-8 w-8 text-[var(--chart-3)] hover:text-[var(--chart-3)] hover:bg-[var(--chart-3)]/10"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onViewHistory} title="History" className="h-8 w-8 text-muted-foreground hover:text-foreground">
        <BarChart2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} title="Delete" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
