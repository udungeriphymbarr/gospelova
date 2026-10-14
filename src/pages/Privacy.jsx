import "../styles/Privacy.css";

export default function Privacy() {
  const lastUpdated = "October 14, 2026";

  return (
    <main className="privacy-page">
      <h1>Privacy Policy</h1>

      <p className="privacy-updated">Last updated: {lastUpdated}</p>

      <p className="privacy-intro">
        Welcome to Gospelova — Your Sound. Your Faith. Your Gospel. This Privacy
        Policy explains how Gospelova handles information when you visit our
        website, explore gospel music, read lyrics, or download available music.
      </p>

      <section>
        <h2>1. Information We May Collect</h2>
        <p>
          Depending on how you use Gospelova, we may collect technical
          information such as your browser type, device information, approximate
          location derived from your IP address, pages visited, referral source,
          and interactions with the website.
        </p>
        <p>
          If you contact us, we may receive the name, email address, message, or
          other details you choose to provide. Please avoid sending sensitive
          personal information unless it is necessary.
        </p>
      </section>

      <section>
        <h2>2. How We Use Information</h2>
        <p>Information may be used to:</p>
        <ul>
          <li>Operate and maintain the Gospelova website.</li>
          <li>Understand website traffic and improve the user experience.</li>
          <li>Monitor website performance, security, and technical issues.</li>
          <li>Respond to enquiries, feedback, and copyright requests.</li>
          <li>
            Support advertising and monetization if these services are
            introduced.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Cookies and Similar Technologies</h2>
        <p>
          Cookies and similar technologies may be used by Gospelova or
          third-party services to support website functionality, understand
          usage, measure advertising, or personalize content where applicable.
        </p>
        <p>
          Google Analytics is used to measure website activity. If advertising
          services such as Google AdSense are enabled in the future, those
          services may use cookies or similar technologies to deliver or measure
          advertisements.
        </p>
        <p>
          You can manage cookies through your browser settings. Blocking some
          cookies may affect certain website features. Where consent is legally
          required, applicable technologies should not be activated before the
          required consent is obtained.
        </p>
      </section>

      <section>
        <h2>4. Analytics and Advertising Services</h2>
        <p>
          Gospelova uses Google Analytics to understand how visitors use the
          website, including which pages are visited. Google may process
          technical and usage information as a service provider under its
          applicable terms and privacy documentation.
        </p>
        <p>
          If third-party advertising is introduced, advertising providers may
          collect or receive information about visits to this and other websites
          to provide, measure, or personalize advertising, subject to applicable
          settings and consent requirements.
        </p>
        <p>
          Learn more in Google's{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            information about advertising technologies
          </a>
          .
        </p>
      </section>

      <section>
        <h2>5. Music Downloads, Lyrics, and Third-Party Links</h2>
        <p>
          Gospelova provides gospel music-related content, including music
          downloads and lyrics. Downloading a file may involve technical
          information being processed by the website's hosting or storage
          providers.
        </p>
        <p>
          Our website may link to third-party websites or services. We do not
          control their privacy practices, so please review their policies
          before sharing information with them.
        </p>
      </section>

      <section>
        <h2>6. Data Sharing and Service Providers</h2>
        <p>
          We may use hosting, database, analytics, security, email, or other
          service providers to operate Gospelova. These providers may process
          information as needed to deliver their services.
        </p>
        <p>
          Information may also be disclosed where required by law, to protect
          rights and safety, or to address security and abuse issues. We do not
          sell personal information as a standalone data-broker product.
        </p>
      </section>

      <section>
        <h2>7. Data Retention and Security</h2>
        <p>
          Information is retained for as long as reasonably necessary for the
          purposes described in this policy, unless a longer period is required
          or permitted by law.
        </p>
        <p>
          We use reasonable measures to protect information, but no website or
          internet transmission can be guaranteed to be completely secure.
        </p>
      </section>

      <section>
        <h2>8. Your Privacy Choices and Rights</h2>
        <p>
          Depending on your location and applicable law, you may have rights to
          request access to, correction of, deletion of, or information about
          the processing of your personal data. You may also have the right to
          object to or restrict certain processing.
        </p>
        <p>
          You can manage browser cookies through your browser settings. Where
          applicable, you may also manage advertising or analytics preferences
          through available controls.
        </p>
      </section>

      <section>
        <h2>9. Children's Privacy</h2>
        <p>
          Gospelova is not intended to knowingly collect personal information
          from children in violation of applicable law. If you believe a child
          has provided personal information inappropriately, contact us so that
          we can review the matter.
        </p>
      </section>

      <section>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy when our website, services,
          technology, or legal obligations change. Updates will be published on
          this page with a revised date.
        </p>
      </section>

      <section>
        <h2>11. Contact Gospelova</h2>
        <p>
          For privacy questions or requests, contact us through our{" "}
          <a href="/contact">Contact page</a>.
        </p>
      </section>
    </main>
  );
}
