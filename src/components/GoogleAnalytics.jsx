import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CONSENT_KEY = "gospelova_cookie_consent";

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Never track admin pages.
    if (location.pathname.startsWith("/admin")) return;

    function trackPageView() {
      if (typeof window.gtag !== "function") return;

      let consent;

      try {
        consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      } catch {
        return;
      }

      // Track only after explicit analytics consent.
      if (!consent || consent.analytics !== true) return;

      window.gtag("event", "page_view", {
        page_path: location.pathname + location.search + location.hash,
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    trackPageView();

    // Re-check consent when the visitor changes their choice.
    window.addEventListener("gospelova-consent-updated", trackPageView);

    return () => {
      window.removeEventListener("gospelova-consent-updated", trackPageView);
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
}
