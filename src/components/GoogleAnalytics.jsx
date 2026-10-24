import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const CONSENT_KEY = "gospelova_cookie_consent";
const ADMIN_EXCLUSION_KEY = "gospelova_exclude_analytics";

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Never track admin routes.
    if (location.pathname.startsWith("/admin")) return;

    // Never track this browser when admin exclusion is enabled.
    if (localStorage.getItem(ADMIN_EXCLUSION_KEY) === "true") return;

    function trackPageView() {
      if (typeof window.gtag !== "function") return;

      // Check exclusion again before sending a page view.
      if (localStorage.getItem(ADMIN_EXCLUSION_KEY) === "true") return;

      let consent;

      try {
        consent = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      } catch {
        return;
      }

      if (!consent || consent.analytics !== true) return;

      window.gtag("event", "page_view", {
        page_path: location.pathname + location.search + location.hash,
        page_title: document.title,
        page_location: window.location.href,
      });
    }

    trackPageView();

    window.addEventListener("gospelova-consent-updated", trackPageView);

    return () => {
      window.removeEventListener("gospelova-consent-updated", trackPageView);
    };
  }, [location.pathname, location.search, location.hash]);

  return null;
}
