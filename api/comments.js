import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

const supabase =
  supabaseUrl && supabaseSecretKey
    ? createClient(supabaseUrl, supabaseSecretKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getClientIp(req) {
  // Use the client IP calculated by Vercel's proxy.
  const ip = req.headers["x-real-ip"];

  if (
    typeof ip !== "string" ||
    !ip.trim() ||
    ip.length > 45 ||
    !/^[0-9a-fA-F:.]+$/.test(ip)
  ) {
    return null;
  }

  return ip.trim();
}

function hashClientIp(ip) {
  const secret = process.env.COMMENT_RATE_LIMIT_SECRET;

  if (!secret) {
    throw new Error("Comment rate-limit secret is not configured.");
  }

  return createHmac("sha256", secret)
    .update(ip)
    .digest("hex");
}

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed." });
  }

  const contentLength = Number(req.headers["content-length"] || 0);

  if (contentLength > 10000) {
    return json(res, 413, { error: "Request is too large." });
  }

  if (!supabase) {
    return json(res, 500, { error: "Server configuration error." });
  }

  try {
    // GET: load approved comments for one published song or blog post.
    if (req.method === "GET") {
      const { targetType, targetId } = req.query;

      if (
        !["song", "blog"].includes(targetType) ||
        typeof targetId !== "string" ||
        !UUID_PATTERN.test(targetId)
      ) {
        return json(res, 400, { error: "Invalid comment target." });
      }

      const table = targetType === "song" ? "songs" : "blog_posts";
      const foreignKey =
        targetType === "song" ? "song_id" : "blog_post_id";

      const { data: target, error: targetError } = await supabase
        .from(table)
        .select("id")
        .eq("id", targetId)
        .eq("is_published", true)
        .maybeSingle();

      if (targetError) {
        console.error("Comment target lookup failed:", targetError.message);
        return json(res, 500, { error: "Could not load comments." });
      }

      if (!target) {
        return json(res, 404, { error: "This page was not found." });
      }

      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("id, name, content, created_at")
        .eq(foreignKey, targetId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(100);

      if (commentsError) {
        console.error("Comments lookup failed:", commentsError.message);
        return json(res, 500, { error: "Could not load comments." });
      }

      return json(res, 200, { comments: comments || [] });
    }

    // POST: validate and submit a comment for moderation.
    const { targetType, targetId, name, content, website } = req.body || {};

    if (typeof website === "string" && website.trim() !== "") {
      return json(res, 400, { error: "Invalid comment submission." });
    }

    if (
      !["song", "blog"].includes(targetType) ||
      typeof targetId !== "string" ||
      !UUID_PATTERN.test(targetId) ||
      typeof name !== "string" ||
      typeof content !== "string"
    ) {
      return json(res, 400, { error: "Invalid comment submission." });
    }

    const cleanName = name.trim();
    const cleanContent = content.trim();

    if (cleanName.length < 1 || cleanName.length > 80) {
      return json(res, 400, {
        error: "Name must be between 1 and 80 characters.",
      });
    }

    if (cleanContent.length < 1 || cleanContent.length > 2000) {
      return json(res, 400, {
        error: "Comment must be between 1 and 2000 characters.",
      });
    }

    const table = targetType === "song" ? "songs" : "blog_posts";

    const { data: target, error: targetError } = await supabase
      .from(table)
      .select("id")
      .eq("id", targetId)
      .eq("is_published", true)
      .maybeSingle();

    if (targetError) {
      console.error("Comment target lookup failed:", targetError.message);
      return json(res, 500, { error: "Could not verify this page." });
    }

    if (!target) {
      return json(res, 404, { error: "This page was not found." });
    }

        // Apply rate limiting after validating the published target.
    const clientIp = getClientIp(req);

    if (!clientIp) {
      return json(res, 503, {
        error: "Comment submission is temporarily unavailable.",
      });
    }

    const ipHash = hashClientIp(clientIp);

    const { data: allowed, error: rateLimitError } = await supabase.rpc(
      "check_comment_rate_limit",
      { p_ip_hash: ipHash }
    );

    if (rateLimitError) {
      console.error(
        "Comment rate-limit check failed:",
        rateLimitError.message
      );

      return json(res, 503, {
        error: "Comment submission is temporarily unavailable.",
      });
    }

    if (allowed !== true) {
      res.setHeader("Retry-After", "600");

      return json(res, 429, {
        error: "Too many comments. Please try again in 10 minutes.",
      });
    }

    const row =
      targetType === "song"
        ? {
            song_id: targetId,
            blog_post_id: null,
            name: cleanName,
            content: cleanContent,
            status: "pending",
          }
        : {
            song_id: null,
            blog_post_id: targetId,
            name: cleanName,
            content: cleanContent,
            status: "pending",
          };

    const { error: insertError } = await supabase
      .from("comments")
      .insert(row);

    if (insertError) {
      console.error("Comment insert failed:", insertError.message);
      return json(res, 500, { error: "Could not submit your comment." });
    }

    return json(res, 201, {
      message: "Your comment was submitted for moderation.",
    });
  } catch (error) {
    console.error("Comment API error:", error);
    return json(res, 500, { error: "An unexpected error occurred." });
  }
}
