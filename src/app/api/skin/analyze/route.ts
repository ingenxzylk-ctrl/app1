import { NextResponse } from "next/server";
import { analyzeFaceImages, hasGeminiKey } from "@/lib/gemini";
import { fallbackAnalysis } from "@/lib/result-engine";
import type { Gender, QuizAnswer } from "@/lib/types";

interface AnalyzeBody {
  front?: string;
  threeQuarter?: string;
  gender?: Gender;
  ageRange?: string;
  skinType?: string;
  sessionId?: string;
  answers?: QuizAnswer[];
}

export async function POST(request: Request) {
  let body: AnalyzeBody = {};
  try {
    body = (await request.json()) as AnalyzeBody;

    if (!body.front) {
      return NextResponse.json({ error: "A front photo is required." }, { status: 400 });
    }

    if (!hasGeminiKey()) {
      return NextResponse.json(fallbackAnalysis(body.answers ?? []));
    }

    if (!body.gender) {
      return NextResponse.json({ error: "Gender path is required." }, { status: 400 });
    }

    const analysis = await analyzeFaceImages({
      front: body.front,
      threeQuarter: body.threeQuarter,
      gender: body.gender,
      ageRange: body.ageRange ?? "",
      skinType: body.skinType ?? "",
      sessionId: body.sessionId ?? "",
    });
    return NextResponse.json(analysis);
  } catch (err) {
    if (body.answers) {
      const fallback = fallbackAnalysis(body.answers);
      fallback.summary = `Model unavailable — used deterministic fallback. ${err instanceof Error ? err.message : ""}`;
      return NextResponse.json(fallback);
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed." },
      { status: 500 },
    );
  }
}
