import { Link } from "react-router-dom";
import SEO from "../components/SEO";

function Copyright() {
  return (
    <>
      <SEO
        title="Copyright Policy"
        description="Read Gospelova's copyright policy covering gospel music downloads, lyrics, artwork, content submissions, and how to report potential copyright infringement."
        url="/copyright"
      />

      <section className="page copyright-page">
        <div className="container">
          <header className="copyright-header">
            <span className="copyright-eyebrow">
              GOSPELOVA • CONTENT & COPYRIGHT
            </span>

            <h1>Copyright Policy</h1>

            <p className="copyright-intro">
              Your Sound. Your Faith. Your Gospel.
            </p>

            <p>
              Gospelova respects the rights of artists, songwriters, producers,
              record labels, publishers, and other content owners. This policy
              explains how copyrighted content is handled on our platform.
            </p>
          </header>

          <div className="copyright-content">
            <section>
              <h2>1. Ownership of Content</h2>
              <p>
                Unless otherwise stated, the Gospelova name, logo, original
                website design, original articles, and other original materials
                created by Gospelova belong to Gospelova or their respective
                creators and are protected by applicable intellectual property
                laws.
              </p>
              <p>
                Music, lyrics, album artwork, photographs, videos, and other
                materials belonging to third parties remain the property of
                their respective copyright owners. Publishing content on
                Gospelova does not transfer ownership to us.
              </p>
            </section>

            <section>
              <h2>2. Music Downloads and Sharing</h2>
              <p>
                Gospelova aims to help listeners discover gospel music and
                connect with gospel artists. Music made available for download
                should be shared with the permission of the relevant rights
                holders or under another valid legal authorization.
              </p>
              <ul>
                <li>
                  Download music only for uses permitted by the relevant rights
                  holder and applicable law.
                </li>
                <li>
                  Do not redistribute downloaded music for commercial purposes
                  without the necessary permission.
                </li>
                <li>
                  Do not remove copyright notices or misrepresent another
                  person's work as your own.
                </li>
                <li>
                  A free download does not automatically grant permission to
                  reproduce, modify, sell, or commercially exploit a song.
                </li>
              </ul>
            </section>

            <section>
              <h2>3. Lyrics, Artwork, and Other Materials</h2>
              <p>
                Lyrics, cover images, artist photographs, and other materials
                may be protected by copyright even when they are publicly
                available online. Users must respect the rights associated with
                these materials.
              </p>
              <p>
                Unless permission or applicable law allows otherwise, do not
                copy, republish, modify, or commercially use Gospelova's
                original content or third-party materials obtained through the
                platform.
              </p>
            </section>

            <section>
              <h2>4. Artist and Rights-Holder Responsibilities</h2>
              <p>
                Anyone submitting music, lyrics, artwork, or other materials for
                publication on Gospelova must have the necessary rights,
                permissions, or authorization to submit and distribute that
                content.
              </p>
              <p>
                By submitting content, you authorize Gospelova to host, display,
                promote, and make that content available through the platform as
                agreed or permitted by the applicable submission terms. You
                retain ownership of your work unless a separate written
                agreement states otherwise.
              </p>
            </section>

            <section>
              <h2>5. Reporting Copyright Infringement</h2>
              <p>
                If you own copyrighted material or are authorized to act for a
                rights holder and believe that content on Gospelova infringes
                your rights, please contact us through our contact page.
              </p>
              <p>Where possible, include the following information:</p>
              <ul>
                <li>Your name and contact information.</li>
                <li>
                  Identification of the copyrighted work you believe has been
                  infringed.
                </li>
                <li>
                  The exact Gospelova page or URL where the content appears.
                </li>
                <li>
                  An explanation of your ownership or authority to represent the
                  rights holder.
                </li>
                <li>
                  A statement explaining why you believe the use is
                  unauthorized.
                </li>
              </ul>
              <p>
                We will review reports and may restrict access to, remove, or
                investigate reported content where appropriate. We may request
                additional information before taking action.
              </p>
              <p>
                <strong>Submit a report:</strong>{" "}
                <Link to="/contact">Contact Gospelova</Link>
              </p>
            </section>

            <section>
              <h2>6. Repeat Infringement</h2>
              <p>
                Gospelova may restrict submissions or suspend access for users
                or contributors who repeatedly publish content that infringes
                the rights of others, where appropriate and consistent with
                applicable law.
              </p>
            </section>

            <section>
              <h2>7. External Links and Third-Party Content</h2>
              <p>
                Gospelova may link to external websites or identify artists and
                rights holders when presenting music and related information. We
                do not necessarily own, control, or endorse content hosted on
                third-party websites. Please review their terms and policies
                before using their services.
              </p>
            </section>

            <section>
              <h2>8. Policy Updates</h2>
              <p>
                We may update this policy as Gospelova develops or when
                necessary to reflect changes in our practices or applicable
                requirements. Updates will be published on this page.
              </p>
            </section>

            <section>
              <h2>9. Contact Us</h2>
              <p>
                For copyright questions, permissions, removal requests, or other
                intellectual property concerns, please reach out through our
                contact page.
              </p>
              <Link className="copyright-contact-link" to="/contact">
                Contact Gospelova
              </Link>
            </section>
          </div>

          <footer className="copyright-footer">
            <p>Gospelova — Your Sound. Your Faith. Your Gospel.</p>
            <p>
              This page provides general information and is not a substitute for
              legal advice.
            </p>
          </footer>
        </div>
      </section>
    </>
  );
}

export default Copyright;
