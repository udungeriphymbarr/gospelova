import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MEASUREMENT_ID = "G-N5195NEWX2";

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Do not track admin pages
    if (location.pathname.startsWith("/admin")) return;

    if (typeof window.gtag !== "function") return;

    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search + location.hash,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location.pathname, location.search, location.hash]);

  return null;
}
