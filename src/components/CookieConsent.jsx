import { useEffect, useState } from "react";
import "../styles/cookieconsent.css";

const CONSENT_KEY = "gospelova_cookie_consent";

const DEFAULT_CONSENT = {
  analytics: false,
  advertising: false,
};

function updateGoogleConsent(consent) {
  if (typeof window.gtag !== "function") return;

  window.gtag("consent", "update", {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.advertising ? "granted" : "denied",
    ad_user_data: consent.advertising ? "granted" : "denied",
    ad_personalization: consent.advertising ? "granted" : "denied",
  });
}

export default function CookieConsent() {
  const [consent, setConsent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          typeof parsed.analytics === "boolean" &&
          typeof parsed.advertising === "boolean"
        ) {
          setConsent(parsed);
          setAnalytics(parsed.analytics);
          setAdvertising(parsed.advertising);
          setVisible(false);
          updateGoogleConsent(parsed);
        }
      }
    } catch {
      localStorage.removeItem(CONSENT_KEY);
    }
  }, []);

  function saveConsent(nextConsent) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(nextConsent));
    } catch {
      // The choice still applies to the current session.
    }

    setConsent(nextConsent);
    setAnalytics(nextConsent.analytics);
    setAdvertising(nextConsent.advertising);
    setShowSettings(false);
    updateGoogleConsent(nextConsent);

    window.dispatchEvent(new Event("gospelova-consent-updated"));

    setClosing(true);

    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 250);
  }

  function openSettings() {
    setAnalytics(consent?.analytics ?? false);
    setAdvertising(consent?.advertising ?? false);
    setShowSettings(true);
    setVisible(true);
    setClosing(false);
  }

  function rejectOptional() {
    saveConsent(DEFAULT_CONSENT);
  }

  function acceptAll() {
    saveConsent({ analytics: true, advertising: true });
  }

  function saveSettings() {
    saveConsent({ analytics, advertising });
  }

  function closeSettings() {
    if (showSettings && !consent) {
      // No choice has been saved yet.
      // Return to the main banner instead of dismissing it.
      setShowSettings(false);
      return;
    }

    setShowSettings(false);
    setClosing(true);

    window.setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 250);
  }

  return (
    <>
      {!visible && (
        <button
          type="button"
          className="cookie-reopen"
          onClick={openSettings}
          aria-label="Open cookie settings"
        >
          Cookie settings
        </button>
      )}

      {visible && (
        <section
          className={`cookie-banner${closing ? " cookie-banner--closing" : ""}`}
          role="dialog"
          aria-label="Cookie consent"
          aria-modal="false"
        >
          <button
            type="button"
            className="cookie-close"
            onClick={closeSettings}
            aria-label="Close cookie banner"
          >
            ×
          </button>

          <div className="cookie-banner__content">
            <h2>
              {showSettings ? "Cookie preferences" : "Your privacy matters"}
            </h2>

            {!showSettings && (
              <>
                <p>
                  Gospelova uses essential storage to operate this website. With
                  your permission, we use analytics and may enable advertising
                  technologies.
                </p>
                <a href="/privacy">Read our Privacy Policy</a>
              </>
            )}
          </div>

          {showSettings && (
            <div className="cookie-settings">
              <p>
                Choose which optional technologies Gospelova may use. Essential
                storage is always active.
              </p>

              <label>
                <input type="checkbox" checked disabled />
                Essential storage
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(event) => setAnalytics(event.target.checked)}
                />
                Analytics
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={advertising}
                  onChange={(event) => setAdvertising(event.target.checked)}
                />
                Advertising
              </label>

              <div className="cookie-banner__actions">
                <button type="button" onClick={saveSettings}>
                  Save preferences
                </button>
                <button type="button" onClick={rejectOptional}>
                  Reject optional
                </button>
              </div>
            </div>
          )}

          {!showSettings && (
            <div className="cookie-banner__actions">
              <button type="button" onClick={acceptAll}>
                Accept all
              </button>

              <button type="button" onClick={rejectOptional}>
                Reject optional
              </button>

              <button type="button" onClick={openSettings}>
                Cookie settings
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
