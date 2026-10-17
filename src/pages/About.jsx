import "../styles/music.css";
import "../styles/about.css";
import SEO from "../components/SEO";

function About() {
  return (
    <>
      <SEO
        title="About Gospelova"
        description="Discover Gospelova's mission to share gospel music and spread the message of Christ."
        url="/about"
      />

      <main className="about-page">
        <section className="about-hero">
          <div className="container">
            <p className="about-eyebrow">OUR STORY · OUR MISSION</p>

            <h1>
              Your Sound. Your Faith. <span>Your Gospel.</span>
            </h1>

            <p className="about-intro">
              Gospelova exists to share gospel music, celebrate gospel artists,
              and spread the message of Christ through sound, stories, lyrics,
              and inspiring Christian content.
            </p>
          </div>
        </section>

        <section className="about-mission">
          <div className="container">
            <p className="about-eyebrow">WHY GOSPELOVA EXISTS</p>

            <h2>Sharing the sound of faith.</h2>

            <p>
              We believe gospel music can encourage hearts, strengthen faith,
              and spread the message of Jesus Christ. Gospelova exists to make
              gospel music easier to discover while giving gospel singers and
              emerging artists a platform to be heard, share their gifts with
              wider audiences, and promote their voices and ministries. Through
              songs, lyrics, artist stories, and inspiring Christian content, we
              aim to connect gospel artists with listeners across the world and
              help the message of Christ reach more hearts.
            </p>
          </div>
        </section>

        <section className="about-founder">
          <div className="container about-founder-layout">
            <div className="about-founder-photo">
              <img
                src="/Talentz.png"
                alt="Udungeri Phymbarr Talentz, founder of Gospelova"
              />
            </div>

            <div className="about-founder-copy">
              <p className="about-eyebrow">MEET THE FOUNDER</p>

              <h2>Udungeri Phymbarr Talentz</h2>

              <p>
                Gospelova was created from a passion for gospel music and a
                desire to spread the message of Christ. Beyond making gospel
                songs and lyrics accessible, the vision is to help gospel
                singers reach more people, gain greater visibility, and share
                the gifts God has placed in them. We want their voices to be
                heard, their music to reach new audiences, and their message to
                inspire lives beyond their immediate communities.
              </p>

              <p>
                This is a growing platform built around faith, music, and the
                belief that the message of Christ deserves to be heard.
              </p>
            </div>
          </div>
        </section>

        <section className="about-vision">
          <div className="container">
            <p className="about-eyebrow">OUR VISION</p>

            <h2>Let the message of Christ be heard.</h2>

            <p>
              Our vision is to build a welcoming home for gospel music where
              listeners can discover songs, read lyrics, learn about artists,
              and find content that inspires faith.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export default About;
