// app/api/generate-notes/route.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    // READ request body first
    const body = await req.json();
    const topic = (body.topic || "").trim();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Please provide a topic in the request body." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // initialize Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // pick a supported model (use one that works for you)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Generate short and simple study notes on the topic: "${topic}".

Follow this exact format:
- Use numbered sections (1, 1.1, 1.2, etc.)
- Include bullet points only under sub-points
- Use simple and short explanation sentences
- Include at least two working code example or real world example
- Use bold for headings only
- Keep notes beginner and intermediate -friendly

Example Format Output:
1. **Main Concept**
    1.1 Sub Concept (short explanation)
    • Key bullet points
    1.2 Sub Concept (short explanation)
    • Key bullet points

2. **Second Concept**
    2.1 Sub Concept
    • Points here

Topic: ${topic}
Generate notes below:
`;

    const result = await model.generateContent(prompt);

    // result.response.text() returns the generated text
    const notes = result.response?.text?.() ?? result.response?.text ?? "";

    return new Response(JSON.stringify({ notes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notes API Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
