// app/api/Job/route.js
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/prisma";

const MODEL_NAME = "gemini-2.5-flash"; // change if you use a different supported model
const BATCH_SIZE = 10; // total jobs to generate upfront

function buildPrompt(user, interviewScore) {
  return `
You are an AI Career Advisor for India. Based on the user's profile below, generate exactly ${BATCH_SIZE} unique job role suggestions.
Return output as strict JSON: an array of objects.

User profile:
- Skills: ${user.skills?.join(", ") || "None"}
- Industry: ${user.industry || "General"}
- Experience (years): ${user.experience ?? 0}
- Latest interview score: ${interviewScore ?? "Not Available"}

For each job object include these properties:
{
  "jobTitle": "string",
  "whyGoodFit": "string (one sentence)",
  "keySkills": ["skill1","skill2", ...],
  "difficultyLevel": "Low|Medium|High",
  "salaryRange": "string (India currency range, optional)"
}

Rules:
- Output must be valid JSON only (no markdown, no extra commentary).
- Provide diversified roles (entry, junior, mid) depending on experience.
- Prefer India-relevant roles and salary ranges in INR.
  `;
}

export async function GET() {
  try {
    const userAuth = await currentUser();
    if (!userAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userAuth.id;

    // fetch user and latest assessment
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        industry: true,
        skills: true,
        experience: true,
        assessments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { quizScore: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Profile missing" }, { status: 404 });

    const interviewScore = user.assessments?.[0]?.quizScore ?? null;

    // Prepare prompt and call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = buildPrompt(user, interviewScore);

    const result = await model.generateContent(prompt);

    // result.response.text() may include fences — clean and parse
    const raw = result.response?.text?.() ?? result.response?.text ?? "";
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let jobs = [];
    try {
      const parsed = JSON.parse(cleaned);
      // Ensure parsed is array and map to desired fallback-safe object shape
      if (Array.isArray(parsed)) {
        jobs = parsed.map((j, i) => ({
          jobTitle: j.jobTitle ?? j.job_title ?? j.title ?? `Role ${i + 1}`,
          whyGoodFit: j.whyGoodFit ?? j.why_good_fit ?? j.reason ?? "",
          keySkills: Array.isArray(j.keySkills) ? j.keySkills : (j.key_skills ? j.key_skills : []),
          difficultyLevel: j.difficultyLevel ?? j.difficulty ?? "Medium",
          salaryRange: j.salaryRange ?? j.salary_range ?? j.salary ?? "",
        }));
      }
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, "raw:", raw);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Safety: if Gemini returned fewer than BATCH_SIZE, we still return whatever we have
    return NextResponse.json({ jobs });
  } catch (err) {
    console.error("Job generation error:", err);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
