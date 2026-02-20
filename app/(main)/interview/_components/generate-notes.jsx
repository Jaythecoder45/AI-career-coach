"use client";

import { useState } from "react";

export default function GenerateNotes() {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  const generateNotes = async () => {
    setLoading(true);

    const res = await fetch("/api/generate-notes", {
      method: "POST",
    });

    if (!res.ok) {
      alert("Failed to generate notes!");
      setLoading(false);
      return;
    }

    const data = await res.json();

    setNotes(data.notes);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={generateNotes}
        disabled={loading}
        className="px-4 py-2 bg-primary text-white rounded-md"
      >
        {loading ? "Generating..." : "Generate Notes"}
      </button>

      {notes && (
        <div className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
          {notes}
        </div>
      )}
    </div>
  );
}
