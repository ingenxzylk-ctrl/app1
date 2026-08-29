import { NextResponse } from "next/server";
import { saveSession } from "@/lib/store";
import type { QuizState } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuizState;
    if (!body?.sessionId || !body.aboutMe) {
      return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
    }
    saveSession(body);
    return NextResponse.json({
      sessionId: body.sessionId,
      resumeUrl: `/quiz/resume/${body.sessionId}`,
    });
  } catch {
    return NextResponse.json({ error: "Could not save session." }, { status: 500 });
  }
}
