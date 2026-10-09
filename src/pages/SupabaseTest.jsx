import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function SupabaseTest() {
  const [status, setStatus] = useState("Testing connection...");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .limit(5);

      if (error) {
        setStatus(`Connection failed: ${error.message}`);
        return;
      }

      setCategories(data ?? []);
      setStatus("Connected to Supabase successfully!");
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Gospelova Database Test</h1>
      <p>{status}</p>

      {categories.length > 0 ? (
        <ul>
          {categories.map((category) => (
            <li key={category.id}>
              {category.name} — {category.slug}
            </li>
          ))}
        </ul>
      ) : (
        <p>No categories found yet, or the table is empty.</p>
      )}
    </main>
  );
}
