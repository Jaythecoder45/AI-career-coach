"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function NotesPage() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);



  async function downloadPDF() {
  const res = await fetch("/api/download-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      notes,
    }),
  });

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${title}.pdf`;
  link.click();

  window.URL.revokeObjectURL(url);
}

<Button onClick={downloadPDF} className="mt-3">
  Download Notes as PDF
</Button>


  async function generateNotes() {
    if (!topic.trim()) return;

    setLoading(true);
    setNotes("");

    const response = await fetch("/api/generate-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    const data = await response.json();
    setNotes(data.notes);
    setLoading(false);
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl space-y-6">
      <h1 className="text-5xl font-bold gradient-title">AI Notes Generator</h1>

      <p className="text-muted-foreground">
        Write a topic, and AI will generate interview preparation notes.
      </p>

      <Textarea
        placeholder="Example: React Hooks, Data Structures, Cloud Computing..."
        className="min-h-[120px]"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <Button onClick={generateNotes} disabled={loading}>
        {loading ? "Generating..." : "Generate Notes"}
      </Button>

      {notes && (
        <div className="p-5 border rounded-lg bg-white shadow-md mt-6">
          <h2 className="text-2xl font-bold mb-3">Generated Notes:</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
}
