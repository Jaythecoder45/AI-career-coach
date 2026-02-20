import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST() {
  const { userId } = auth();

  if (!userId) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { clerkId: userId },
  });

  if (!existingUser) {
    await db.user.create({
      data: {
        clerkId: userId,
        onboardingCompleted: false
      },
    });
  }

  return Response.json({ success: true });
}
