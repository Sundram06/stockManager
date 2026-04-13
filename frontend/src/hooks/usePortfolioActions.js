import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { API_URL } from "../util/api/config.mjs";
import { queryClient } from "../util/api/queryClient.mjs";
import { createStock } from "../util/api/stocks.mjs";
import {
	handleAddStockRowInHistory,
	handleSellStockRowInHistory,
} from "../util/api/history.mjs";
import { addStockToPortfolio } from "../store/stocks-slice";

export default function usePortfolioActions({ setAddOpen, setDeleteModalOpen }) {
	const dispatch = useDispatch();

	const { mutate: mutateAdd } = useMutation({
		mutationFn: createStock,
		onSuccess: (data) => {
			dispatch(addStockToPortfolio(data));
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
		},
	});

	const { mutate: mutateAddToHistory } = useMutation({
		mutationFn: handleAddStockRowInHistory,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
		},
	});

	const { mutate: mutateSell } = useMutation({
		mutationFn: handleSellStockRowInHistory,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
		},
	});

	const { mutate: mutateDelete } = useMutation({
		mutationFn: async (stockId) => {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_URL}/stocks/${stockId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error("Failed to delete stock");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
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
