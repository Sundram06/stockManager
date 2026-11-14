import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, TextField, Typography } from "@mui/material";
import PublicPageLayout from "../component/PublicPageLayout";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "../component/landing/useLandingTokens";
import { sendContactMessage } from "../util/api/contact.mjs";

const EMPTY = { name: "", email: "", message: "", website: "" };

export default function ContactPage() {
	const { textPrimary, textSecondary } = useLandingTokens();
	const [form, setForm] = useState(EMPTY);
	const { mutate, isPending, isSuccess, error, data, reset } = useMutation({
		mutationFn: sendContactMessage,
		onSuccess: () => setForm(EMPTY),
	});

	const update = (field) => (event) => {
		if (isSuccess || error) reset();
		setForm((current) => ({ ...current, [field]: event.target.value }));
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		mutate(form);
	};

	return (
		<PublicPageLayout maxWidth="620px">
			<Typography component="h1" sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: "2.4rem", md: "3.2rem" }, fontWeight: 700, color: textPrimary, lineHeight: 1.1 }}>
				Contact
			</Typography>
			<Typography sx={{ fontFamily: FONT_BODY, fontSize: "1rem", lineHeight: 1.7, color: textSecondary, mt: 2, mb: 4 }}>
				Questions, bugs, or a request to delete your account. We reply by email, usually within a few days.
			</Typography>

			{isSuccess && <Alert severity="success" sx={{ mb: 3 }}>{data?.message}</Alert>}
			{error && <Alert severity="error" sx={{ mb: 3 }}>{error.message}</Alert>}

			<Box component="form" onSubmit={handleSubmit} noValidate={false}>
				<TextField label="Your name" name="name" value={form.name} onChange={update("name")} required fullWidth margin="normal" inputProps={{ maxLength: 100 }} autoComplete="name" />
				<TextField label="Your email" name="email" type="email" value={form.email} onChange={update("email")} required fullWidth margin="normal" autoComplete="email" helperText="We'll reply to this address." />
				<TextField
					label="Message"
					name="message"
					value={form.message}
					onChange={update("message")}
					required
					fullWidth
					margin="normal"
					multiline
					minRows={5}
					inputProps={{ minLength: 10, maxLength: 5000 }}
				/>
				{/* Hidden from people; automated spam fills it in and is refused. */}
				<Box aria-hidden sx={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
					<label htmlFor="contact-website">Leave this empty</label>
					<input id="contact-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
				</Box>
				<Button type="submit" variant="contained" disabled={isPending} sx={{ mt: 3, px: 5, py: 1.4 }}>
					{isPending ? "Sending…" : "Send message"}
				</Button>
			</Box>
		</PublicPageLayout>
	);
}
