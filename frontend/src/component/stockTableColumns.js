// Shared by StockTable and its loading skeleton, so both lay out identically.

export const ACTIVE_COLS = [
	{ id: "name",     label: "Stock",         align: "left"   },
	{ id: "qty",      label: "Quantity",       align: "right"  },
	{ id: "avgPrice", label: "Avg. Buy Price", align: "right"  },
	{ id: "invested", label: "Total Invested", align: "right"  },
	{ id: "ltp",      label: "LTP",            align: "right"  },
	{ id: "currVal",  label: "Current Value",  align: "right"  },
	{ id: "pnl",      label: "P&L",            align: "right"  },
];

export const DORMANT_COLS = [
	{ id: "name",      label: "Stock",           align: "left"  },
	{ id: "qty",       label: "Qty Sold",         align: "right" },
	{ id: "avgPrice",  label: "Avg. Buy Price",   align: "right" },
	{ id: "invested",  label: "Total Invested",   align: "right" },
	{ id: "sellPrice", label: "Avg. Sell Price",  align: "right" },
	{ id: "sellVal",   label: "Sell Value",       align: "right" },
	{ id: "pnl",       label: "P&L",              align: "right" },
];

export const COL_WIDTHS = {
	name:      "20%",
	qty:       "7%",
	avgPrice:  "11%",
	invested:  "12%",
	ltp:       "9%",
	currVal:   "12%",
	sellPrice: "11%",
	sellVal:   "12%",
	pnl:       "11%",
	actions:   "88px",
};
