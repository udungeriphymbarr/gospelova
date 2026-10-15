
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { createClient } from "@supabase/supabase-js";

const PROPERTY_ID = "558886826";

function getGoogleCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("Missing Google Analytics credentials.");
  }

  return JSON.parse(raw);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "private, no-store");

  try {
    // Verify the caller's Supabase session.
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const supabase = getSupabaseAdminClient();

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid session." });
    }

    // Only users listed in the admins table may access reports.
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Analytics admin check failed:", adminError.message);
      return res.status(500).json({ error: "Unable to verify admin access." });
    }

    if (!admin) {
      return res.status(403).json({ error: "Admin access required." });
    }

    // Create the GA4 client using server-side credentials.
    const credentials = getGoogleCredentials();

    const analyticsClient = new BetaAnalyticsDataClient({
      credentials,
    });

    const dateRanges = [{ startDate: "29daysAgo", endDate: "today" }];

    const [overviewResponse, pagesResponse] = await Promise.all([
      analyticsClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges,
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "totalUsers" },
        ],
      }),

      analyticsClient.runReport({
        property: `properties/${PROPERTY_ID}`,
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
        ],
        orderBys: [
          {
            metric: { metricName: "screenPageViews" },
            desc: true,
          },
        ],
        limit: 10,
      }),
    ]);

    const overviewValues = overviewResponse[0]?.rows?.[0]?.metricValues || [];

    const overview = {
      activeUsers: Number(overviewValues[0]?.value || 0),
      sessions: Number(overviewValues[1]?.value || 0),
      pageViews: Number(overviewValues[2]?.value || 0),
      totalUsers: Number(overviewValues[3]?.value || 0),
    };

    const topPages = (pagesResponse[0]?.rows || []).map((row) => ({
      pagePath: row.dimensionValues?.[0]?.value || "/",
      pageViews: Number(row.metricValues?.[0]?.value || 0),
      activeUsers: Number(row.metricValues?.[1]?.value || 0),
    }));

    return res.status(200).json({
      propertyId: PROPERTY_ID,
      period: "Last 30 days",
      overview,
      topPages,
    });
  } catch (error) {
    console.error("Google Analytics report failed:", error.message);
    return res.status(500).json({
      error: "Analytics report temporarily unavailable.",
    });
  }
}
