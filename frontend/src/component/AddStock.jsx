/* eslint-disable react/prop-types */
import classes from "./AddStock.module.css";
import { Dialog, Button, DialogActions, TextField } from "@mui/material";

export default function AddStock({
	open,
	mutateCall,
	handleClickCloseDialog,
	nameInputField,
}) {
	const handleClickClose = () => {
		handleClickCloseDialog();
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		console.log(event.target);
		console.log(formData);
		const data = Object.fromEntries(formData);
		data.stockName ? data.stockName.toUpperCase() : null;
		data.avgPrice = parseFloat(data.avgPrice);
		console.log("inside handleSubmit");
		console.log(data);
		mutateCall(data);
		event.target.reset();
		handleClickClose();
	};

	return (
		<>
			<Dialog
				className={classes.dialog}
				open={open}
				onClose={handleClickClose}
				BackdropProps={{
					classes: {
						root: classes.backdrop,
					},
				}}
			>
				<div>
					<form className={classes.dialogContent} onSubmit={handleSubmit}>
						<h3>Stock Name</h3>
						{nameInputField && (
							<TextField
								name="stockName"
								label="Stock Name"
								placeholder="Stock Name"
							/>
						)}
						<TextField
							name="quantity"
							type="number"
							label="Quantity"
							placeholder="Quantity"
							fullWidth
							margin="normal"
						/>
						<TextField
							name="avgPrice"
							label="Average Price"
							type="number"
							step="2"
							placeholder="Buy Price"
							fullWidth
							margin="normal"
						/>
						<TextField
							name="date"
							type="date"
							label="Date Purchased"
							placeholder="Date Purchased"
							fullWidth
							margin="normal"
							InputLabelProps={{ shrink: true }} // Ensures the label shrinks when a value is present
						/>
						<DialogActions>
							<Button type="submit">Add</Button>
							<Button onClick={handleClickClose} type="reset">
								Cancel
							</Button>
						</DialogActions>
					</form>
				</div>
			</Dialog>
		</>
	);
}
