import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SongCard from "../components/SongCard";
import SectionHeading from "../components/SectionHeading";
import "../styles/music.css";
import LoadingState from "../components/LoadingState";

function CategoryDetails() {
  const { slug } = useParams();

  const [category, setCategory] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchCategoryDetails() {
      setLoading(true);
      setError("");
      setCategory(null);
      setSongs([]);

      try {
        // Find the selected category.
        const { data: categoryData, error: categoryError } = await supabase
          .from("categories")
          .select("id, name, slug, description")
          .eq("slug", slug)
          .maybeSingle();

        if (categoryError) throw categoryError;

        if (!categoryData) {
          if (active) setError("This category could not be found.");
          return;
        }

        // Fetch only published songs assigned to this category.
        const { data: songData, error: songsError } = await supabase
          .from("songs")
          .select(
            `
            id,
            title,
            slug,
            cover_image_path,
            audio_path,
            artists ( name )
          `,
          )
          .eq("category_id", categoryData.id)
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (songsError) throw songsError;

        if (active) {
          setCategory(categoryData);
          setSongs(songData ?? []);
        }
      } catch (err) {
        console.error("Error fetching category details:", err);

        if (active) {
          setError("We couldn't load this category. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchCategoryDetails();

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <section className="page category-details-page">
      <div className="container">
        <p>
          <Link to="/categories" className="category-back-link">
            ← All Categories
          </Link>
        </p>

        {loading && <LoadingState message="Loading category and songs..." />}

        {!loading && error && (
          <div className="category-details-message" role="alert">
            <h2>Category unavailable</h2>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && category && (
          <>
            <SectionHeading
              eyebrow="GOSPELOVA CATEGORIES"
              title={category.name}
              description={
                category.description ||
                `Explore gospel songs in the ${category.name} category.`
              }
            />

            {songs.length === 0 ? (
              <div className="category-details-message">
                <h2>No published songs yet</h2>
                <p>
                  There are no published songs in this category at the moment.
                  Check back soon!
                </p>
              </div>
            ) : (
              <div className="song-grid">
                {songs.map((song) => {
                  const coverUrl = song.cover_image_path
                    ? supabase.storage
                        .from("song-cover")
                        .getPublicUrl(song.cover_image_path).data.publicUrl
                    : null;

                  return (
                    <SongCard
                      key={song.id}
                      title={song.title}
                      artist={song.artists?.name ?? "Unknown artist"}
                      image={coverUrl}
                      slug={song.slug}
                    />
                  );
                })}
              </div>
            )}

            <p className="category-song-count">
              {songs.length}{" "}
              {songs.length === 1 ? "published song" : "published songs"}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

export default CategoryDetails;
