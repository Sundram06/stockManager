export const dateFormatter = (date) => {
	return new Date(date).toLocaleDateString();
};

export function calculateStockAge(stockDate) {
	const today = new Date();
	const stockPurchaseDate = new Date(stockDate);

	// Calculate the difference in milliseconds
	const diffInMs = today - stockPurchaseDate;

	// Convert milliseconds to days
	const ageInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
	return ageInDays;
}
