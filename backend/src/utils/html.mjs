const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Makes untrusted text safe to place inside HTML element content or attributes. */
export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
