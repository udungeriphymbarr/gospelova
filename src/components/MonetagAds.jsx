
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MONETAG_ZONES = [
  {
    id: "gospelova-monetag-zone-1",
    zone: "12113230",
    src: "https://nap5k.com/tag.min.js",
  },
  {
    id: "gospelova-monetag-zone-2",
    zone: "12181858",
    src: "https://n6wxm.com/vignette.min.js",
  },
  {
    id: "gospelova-monetag-zone-3",
    zone: "12242594",
    src: "https://al5sm.com/tag.min.js",
  },
];

export default function MonetagAds() {
  const location = useLocation();

  useEffect(() => {
    // Never load Monetag on admin pages.
    if (location.pathname.startsWith("/admin")) {
      MONETAG_ZONES.forEach(({ id }) => {
        document.getElementById(id)?.remove();
      });
      return;
    }

    // Load each zone only once.
    MONETAG_ZONES.forEach(({ id, zone, src }) => {
      if (document.getElementById(id)) return;

      const script = document.createElement("script");
      script.id = id;
      script.dataset.zone = zone;
      script.src = src;
      script.async = true;

      document.head.appendChild(script);
    });

    return () => {
      // Remove scripts when leaving public pages.
      MONETAG_ZONES.forEach(({ id }) => {
        document.getElementById(id)?.remove();
      });
    };
  }, [location.pathname]);

  return null;
}
