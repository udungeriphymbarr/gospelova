import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";
import LoadingState from "../components/LoadingState";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [stats, setStats] = useState({
    totalSongs: 0,
    publishedSongs: 0,
    unpublishedSongs: 0,
    totalArtists: 0,
    totalCategories: 0,
    totalDownloads: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [topDownloadedSongs, setTopDownloadedSongs] = useState([]);
  const [downloadsLoading, setDownloadsLoading] = useState(true);
  const [downloadsError, setDownloadsError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;

        if (!user) {
          navigate("/admin/login", { replace: true });
          return;
        }

        const { data: admin, error: adminError } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminError) throw adminError;

        if (!admin) {
          await supabase.auth.signOut();
          navigate("/admin/login", { replace: true });
          return;
        }

        if (active) {
          setAdminEmail(user.email ?? "");
          setLoading(false);
        }

        // Load statistics only after admin access is verified.

        const [
          songsResult,
          publishedResult,
          unpublishedResult,
          artistsResult,
          categoriesResult,
          downloadsResult,
          topSongsResult,
        ] = await Promise.all([
          supabase.from("songs").select("id", { count: "exact", head: true }),
          supabase
            .from("songs")
            .select("id", { count: "exact", head: true })
            .eq("is_published", true),
          supabase
            .from("songs")
            .select("id", { count: "exact", head: true })
            .eq("is_published", false),
          supabase.from("artists").select("id", { count: "exact", head: true }),
          supabase
            .from("categories")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("song_downloads")
            .select("id", { count: "exact", head: true }),
          supabase.rpc("get_top_downloaded_songs", {
            result_limit: 5,
          }),
        ]);

        const results = [
          songsResult,
          publishedResult,
          unpublishedResult,
          artistsResult,
          categoriesResult,
          downloadsResult,
        ];

        const failedResult = results.find((result) => result.error);
        if (failedResult) throw failedResult.error;

        if (topSongsResult.error) {
          console.error(
            "Top downloaded songs query failed:",
            topSongsResult.error,
          );
          if (active) {
            setDownloadsError("Unable to load most-downloaded songs.");
            setTopDownloadedSongs([]);
          }
        } else if (active) {
          setTopDownloadedSongs(topSongsResult.data ?? []);
          setDownloadsError("");
        }

        if (active) {
          setStats({
            totalSongs: songsResult.count ?? 0,
            publishedSongs: publishedResult.count ?? 0,
            unpublishedSongs: unpublishedResult.count ?? 0,
            totalArtists: artistsResult.count ?? 0,
            totalCategories: categoriesResult.count ?? 0,
            totalDownloads: downloadsResult.count ?? 0,
          });
          setStatsError("");
        }
      } catch (error) {
        if (active) {
          setStatsError("Unable to load statistics. Please refresh the page.");

          setDownloadsError("Unable to load most-downloaded songs.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setStatsLoading(false);
          setDownloadsLoading(false);
        }
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    navigate("/admin/login", { replace: true });
  }

  if (loading) {
    return (
      <main className="admin-login-page">
        <LoadingState message="Verifying admin access..." fullPage />
      </main>
    );
  }

  const statCards = [
    { label: "Total Songs", value: stats.totalSongs, icon: "♫" },
    { label: "Published Songs", value: stats.publishedSongs, icon: "✓" },
    { label: "Unpublished Songs", value: stats.unpublishedSongs, icon: "◷" },
    { label: "Total Artists", value: stats.totalArtists, icon: "♬" },
    { label: "Categories", value: stats.totalCategories, icon: "▦" },
    { label: "Total Downloads", value: stats.totalDownloads, icon: "↓" },
  ];

  return (
    <main className="admin-dashboard-page">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-brand">GOSPELOVA</p>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {adminEmail}</p>
        </div>

        <button type="button" onClick={handleLogout}>
          Sign Out
        </button>
      </header>

      <section className="admin-welcome-card">
        <h2>Your music platform, one place.</h2>
        <p>
          Manage songs, artists, categories, lyrics, blog articles, and cover
          artwork from your Gospelova dashboard.
        </p>

        <div className="admin-dashboard-actions">
          <Link to="/admin/songs/new" className="admin-action-button">
            + Add a Song
          </Link>

          <Link to="/admin/songs" className="admin-action-button">
            Manage Songs
          </Link>

          <Link to="/admin/artists" className="admin-action-button">
            Manage Artists
          </Link>

          <Link to="/admin/categories" className="admin-action-button">
            Manage Categories
          </Link>

          <Link to="/admin/blog/new" className="admin-action-button">
            + Add a Blog Post
          </Link>

          <Link to="/admin/blog" className="admin-action-button">
            Manage Blog Posts
          </Link>

          <Link to="/admin/messages" className="admin-action-button">
            Manage Messages
          </Link>
        </div>
      </section>

      <section className="admin-stats-section">
        <div className="admin-stats-heading">
          <div>
            <h2>Platform Overview</h2>
            <p>Your content statistics from Supabase.</p>
          </div>
        </div>

        {statsError && (
          <p className="admin-stats-error" role="alert">
            {statsError}
          </p>
        )}

        <div className="admin-stats-grid">
          {statCards.map((stat) => (
            <article className="admin-stat-card" key={stat.label}>
              <span className="admin-stat-icon" aria-hidden="true">
                {stat.icon}
              </span>
              <p>{stat.label}</p>
              <strong>
                {statsLoading ? "…" : stat.value.toLocaleString()}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-stats-section">
        <div className="admin-stats-heading">
          <div>
            <h2>Most Downloaded Songs</h2>
            <p>Your top five songs by recorded download clicks.</p>
          </div>
        </div>

        {downloadsError && (
          <p className="admin-stats-error" role="alert">
            {downloadsError}
          </p>
        )}

        {downloadsLoading ? (
          <p>Loading download rankings...</p>
        ) : topDownloadedSongs.length === 0 ? (
          <p>No downloads recorded for published songs yet.</p>
        ) : (
          <div className="admin-top-downloads">
            {topDownloadedSongs.map((song, index) => (
              <article className="admin-top-download-item" key={song.song_id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{song.title}</strong>
                  <p>{song.download_count.toLocaleString()} downloads</p>
                </div>
                <Link to={`/music/${song.slug}`}>View song</Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
