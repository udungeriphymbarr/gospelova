import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MONETAG_SCRIPT_ID = "gospelova-monetag-script";
const MONETAG_ZONE_ID = "12113230";

export default function MonetagAds() {
  const location = useLocation();

  useEffect(() => {
    // Never load Monetag on admin pages.
    if (location.pathname.startsWith("/admin")) {
      document.getElementById(MONETAG_SCRIPT_ID)?.remove();
      return;
    }

    // Avoid adding the script more than once.
    if (document.getElementById(MONETAG_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = MONETAG_SCRIPT_ID;
    script.dataset.zone = MONETAG_ZONE_ID;
    script.src = "https://nap5k.com/tag.min.js";
    script.async = true;

    document.head.appendChild(script);

    return () => {
      // Remove the script when leaving the public website.
      script.remove();
    };
  }, [location.pathname]);

  return null;
}
