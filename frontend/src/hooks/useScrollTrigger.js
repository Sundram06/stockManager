import { useState, useEffect } from "react";

export function useScrollTrigger(threshold = 60) {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const handler = () => setTriggered(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    // Check initial scroll position
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return triggered;
}

export default useScrollTrigger;
