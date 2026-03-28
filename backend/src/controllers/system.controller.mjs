export const root = async (req, res) => {
	return res.status(200).json({ status: "ok" });
};

export const health = async (req, res) => {
	return res.status(200).json({ status: "ok" });
};
