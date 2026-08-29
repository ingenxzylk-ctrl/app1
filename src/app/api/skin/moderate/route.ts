import { NextResponse } from "next/server";
import { moderateFaceImage } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { image?: string };
    if (!body.image) {
      return NextResponse.json({ error: "Image is required." }, { status: 400 });
    }
    if (body.image.length > 8_000_000) {
      return NextResponse.json({ error: "Image is too large. Try a smaller photo." }, { status: 413 });
    }
    const result = await moderateFaceImage(body.image);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Moderation failed." },
      { status: 500 },
    );
  }
}
