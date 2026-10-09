import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          if (active) setStatus("denied");
          return;
        }

        const { data: admin, error: adminError } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (adminError || !admin) {
          if (active) setStatus("denied");
          return;
        }

        if (active) setStatus("allowed");
      } catch {
        if (active) setStatus("denied");
      }
    }

    verifyAccess();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <main className="admin-login-page">
        <p>Verifying admin access...</p>
      </main>
    );
  }

  if (status === "denied") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminRoute;
