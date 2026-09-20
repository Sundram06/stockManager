import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../util/api/queryClient.mjs";
import { createStock, deleteStock } from "../util/api/stocks.mjs";
import {
	handleAddStockRowInHistory,
	handleSellStockRowInHistory,
} from "../util/api/history.mjs";

const refreshPortfolio = () => {
	queryClient.invalidateQueries({ queryKey: ["stocks"] });
	queryClient.invalidateQueries({ queryKey: ["history"] });
};

export default function usePortfolioActions({ setDeleteModalOpen }) {
	const { mutate: mutateAdd } = useMutation({
		mutationFn: createStock,
		onSuccess: refreshPortfolio,
	});

	const { mutate: mutateAddToHistory } = useMutation({
		mutationFn: handleAddStockRowInHistory,
		onSuccess: refreshPortfolio,
	});

	const { mutate: mutateSell } = useMutation({
		mutationFn: handleSellStockRowInHistory,
		onSuccess: refreshPortfolio,
	});

	const { mutate: mutateDelete } = useMutation({
		mutationFn: deleteStock,
		onSuccess: () => {
			refreshPortfolio();
			setDeleteModalOpen(false);
		},
	});

	const submitStockAction = useCallback(
		({ actionType, stockId, data }) => {
			return new Promise((resolve, reject) => {
				const callbacks = { onSuccess: resolve, onError: reject };
				if (actionType === "add") {
					if (stockId) {
						mutateAddToHistory({ ...data, stockId }, callbacks);
					} else {
						mutateAdd(data, callbacks);
					}
				} else if (actionType === "sell") {
					mutateSell({ ...data, stockId }, callbacks);
				}
			});
		},
		[mutateAddToHistory, mutateAdd, mutateSell],
	);

	const deleteStockById = useCallback(
		(stockId) => {
			mutateDelete(stockId);
		},
		[mutateDelete],
	);

	return {
		submitStockAction,
		deleteStockById,
	};
}
