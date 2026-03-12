import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import {
	createStock,
	handleAddStockRowInHistory,
	handleSellStockRowInHistory,
	queryClient,
	API_URL,
} from "../util/http.mjs";
import { addStockToPortfolio } from "../store/stocks-slice";

export default function usePortfolioActions({ setAddOpen, setDeleteModalOpen }) {
	const dispatch = useDispatch();

	const { mutate: mutateAdd } = useMutation({
		mutationFn: createStock,
		onSuccess: (data) => {
			dispatch(addStockToPortfolio(data));
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
			setAddOpen(false);
		},
	});

	const { mutate: mutateAddToHistory } = useMutation({
		mutationFn: handleAddStockRowInHistory,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
			setAddOpen(false);
		},
	});

	const { mutate: mutateSell } = useMutation({
		mutationFn: handleSellStockRowInHistory,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
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
			if (actionType === "add") {
				if (stockId) {
					mutateAddToHistory({ ...data, stockId });
				} else {
					mutateAdd(data);
				}
			} else if (actionType === "sell") {
				mutateSell({ ...data, stockId });
			}
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
