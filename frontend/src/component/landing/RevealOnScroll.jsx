import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";

const prefersReducedMotion = () =>
	typeof window === "undefined" ||
	!("IntersectionObserver" in window) ||
	window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Fades its children up as they scroll into view. Content is shown at once
 * when the browser has no IntersectionObserver or the visitor asks for
 * reduced motion, and the reveal starts slightly before the section is
 * reached, so nothing stays hidden for long.
 */
export default function RevealOnScroll({ children, sx }) {
	const ref = useRef(null);
	const [visible, setVisible] = useState(prefersReducedMotion);

	useEffect(() => {
		if (visible) return undefined;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "0px 0px 15% 0px" },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [visible]);

	return (
		<Box
			ref={ref}
			sx={{
				opacity: visible ? 1 : 0,
				transform: visible ? "none" : "translateY(32px)",
				transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
				...sx,
			}}
		>
			{children}
		</Box>
	);
}

RevealOnScroll.propTypes = {
	children: PropTypes.node,
	sx: PropTypes.object,
};
