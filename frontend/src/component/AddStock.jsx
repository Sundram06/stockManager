/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { API_URL } from "../util/api/config.mjs";

export default function AddStock({
  open,
  mutateCall,
  handleClickCloseDialog,
  nameInputField,
  buttonLabel = "Add",
  maxSellQuantity = Infinity,
  stockName = "",
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [purchaseDate, setPurchaseDate] = useState("");
  const [selectedInstrumentKey, setSelectedInstrumentKey] = useState("");
  const debounceTimeout = useRef();
  const justSelected = useRef(false);

  const searchEndpoint = API_URL
    ? `${API_URL}/api/instruments/search`
    : "/api/instruments/search";

  const handleClickClose = () => {
    setQuery("");
    setErrors({});
    setPurchaseDate("");
    setSelectedInstrumentKey("");
    setSuggestions([]);
    handleClickCloseDialog();
  };

  useEffect(() => {
    if (justSelected.current) { justSelected.current = false; return; }
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (query && query.length >= 2) {
      debounceTimeout.current = setTimeout(() => {
        fetch(`${searchEndpoint}?q=${encodeURIComponent(query)}`)
          .then((res) => res.ok ? res.json() : [])
          .then((data) => setSuggestions(Array.isArray(data) ? data : []))
          .catch(() => setSuggestions([]));
      }, 300);
    } else {
      setSuggestions([]);
    }
    return () => clearTimeout(debounceTimeout.current);
  }, [query, searchEndpoint]);

  const validate = (data) => {
    const newErrors = {};
    if (nameInputField && (!data.stockName || data.stockName.trim() === "")) {
      newErrors.stockName = "Stock Name is required";
    }
    if (nameInputField && data.stockName && !selectedInstrumentKey) {
      newErrors.stockName = "Please select a stock from the suggestions";
    }
    if (!data.quantity || isNaN(data.quantity) || Number(data.quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }
    if (!data.avgPrice || isNaN(data.avgPrice) || Number(data.avgPrice) <= 0) {
      newErrors.avgPrice = "Average Price must be greater than 0";
    }
    if (!data.date) {
      newErrors.date = "Date Purchased is required";
    }
    if (buttonLabel === "Sell" && Number(data.quantity) > maxSellQuantity) {
      newErrors.quantity = `Cannot sell more than available (${maxSellQuantity})`;
    }
    return newErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.date = purchaseDate || "";
    if (data.stockName) data.stockName = data.stockName.toUpperCase();
    data.avgPrice = parseFloat(data.avgPrice);
    if (selectedInstrumentKey) data.instrumentKey = selectedInstrumentKey;

    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    mutateCall(data);
    event.target.reset();
    setQuery("");
    setSelectedInstrumentKey("");
    setPurchaseDate("");
    setSuggestions([]);
    handleClickClose();
  };

  const handleSelect = (stock) => {
    justSelected.current = true;
    setQuery(stock.trading_symbol);
    setSelectedInstrumentKey(stock.instrument_key || "");
    setSuggestions([]);
    document.querySelector("input[name='quantity']")?.focus();
  };

  const isSell = buttonLabel === "Sell";
  const dialogTitle = isSell
    ? `Sell${stockName ? ` ${stockName}` : " Stock"}`
    : `Add${stockName ? ` ${stockName}` : " Stock"}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClickClose()}>
      <DialogContent className="p-0 overflow-visible max-w-md">
        {/* Colored header */}
        <div className="bg-primary text-primary-foreground px-4 py-3">
          <DialogTitle className="text-base font-bold">{dialogTitle}</DialogTitle>
        </div>

        <Separator />

        <div className="p-5">
          <form id="addstock-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Stock name with autocomplete */}
            {nameInputField && (
              <div className="relative">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Stock Name</label>
                <Input
                  name="stockName"
                  placeholder="Search and select a stock"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedInstrumentKey("");
                  }}
                  autoComplete="off"
                  className={cn(errors.stockName && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.stockName && (
                  <p className="text-xs text-destructive mt-0.5">{errors.stockName}</p>
                )}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border bg-popover shadow-lg max-h-52 overflow-y-auto">
                    {suggestions.map((stock, i) => (
                      <button
                        type="button"
                        key={i}
                        onMouseDown={() => handleSelect(stock)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-accent border-b border-border last:border-b-0 transition-colors"
                      >
                        <span className="font-medium">{stock.name}</span>
                        {stock.trading_symbol && (
                          <span className="text-muted-foreground ml-1">({stock.trading_symbol})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
              <Input
                name="quantity"
                type="number"
                placeholder="Quantity"
                min={1}
                max={isSell ? maxSellQuantity : undefined}
                className={cn(errors.quantity && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.quantity && <p className="text-xs text-destructive mt-0.5">{errors.quantity}</p>}
              {isSell && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unsold shares available: <strong>{maxSellQuantity}</strong>
                </p>
              )}
            </div>

            {/* Average Price */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {isSell ? "Selling Price" : "Average Price"}
              </label>
              <Input
                name="avgPrice"
                type="number"
                placeholder={isSell ? "Selling price per share" : "Buy price per share"}
                min={0.01}
                step="any"
                className={cn(errors.avgPrice && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.avgPrice && <p className="text-xs text-destructive mt-0.5">{errors.avgPrice}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {isSell ? "Date Sold" : "Date Purchased"}
              </label>
              <input
                type="date"
                name="date"
                value={purchaseDate}
                onChange={(e) => {
                  setPurchaseDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                className={cn(
                  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "text-foreground [color-scheme:light] dark:[color-scheme:dark]",
                  errors.date && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.date && <p className="text-xs text-destructive mt-0.5">{errors.date}</p>}
            </div>
          </form>
        </div>

        <DialogFooter className="px-5 pb-4 gap-2">
          <Button variant="outline" type="button" onClick={handleClickClose} className="min-w-[80px]">
            Cancel
          </Button>
          <Button
            type="submit"
            form="addstock-form"
            variant={isSell ? "default" : "default"}
            className={cn(
              "min-w-[80px]",
              isSell && "bg-[var(--chart-3)] hover:bg-[var(--chart-3)]/90 text-white"
            )}
          >
            {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
