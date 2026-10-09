import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "../styles/admin.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

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
      } catch (error) {
        console.error("Admin verification failed:", error);

        if (active) {
          setLoading(false);
          navigate("/admin/login", { replace: true });
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
        <p>Verifying admin access...</p>
      </main>
    );
  }

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
          Manage songs, artists, categories, lyrics, and cover artwork from your
          Gospelova dashboard.
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
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
