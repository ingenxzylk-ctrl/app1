import "dotenv/config";
import cors from "cors";
import express from "express";
import { fallbackAnalysis, type Gender, type QuizAnswer, type QuizState } from "@milc/shared";
import {
  analyzeFaceImages,
  geminiAccessHint,
  geminiModelId,
  hasGeminiKey,
  isGeminiAccessBlocked,
  moderateFaceImage,
  probeGeminiAccess,
} from "./gemini";
import { loadSession, saveSession } from "./store";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", async (_req, res) => {
  const hasKey = hasGeminiKey();
  const probe = hasKey ? await probeGeminiAccess() : { reachable: false, error: "No API key" };
  res.json({
    ok: true,
    service: "milc-skin-analysis",
    aiMode: hasKey ? (probe.reachable ? "gemini" : "gemini-blocked") : "fallback",
    geminiModel: probe.model ?? geminiModelId(),
    geminiReachable: probe.reachable,
    geminiModelsAvailable: probe.availableModels,
    geminiModelsTried: probe.modelsTried,
    geminiError: probe.reachable ? undefined : probe.error,
  });
});

app.post("/api/quiz/save", (req, res) => {
  const body = req.body as QuizState;
  if (!body?.sessionId || !body.aboutMe) {
    res.status(400).json({ error: "Invalid session payload." });
    return;
  }
  saveSession(body);
  res.json({
    sessionId: body.sessionId,
    resumeUrl: `/quiz/resume/${body.sessionId}`,
  });
});

app.get("/api/quiz/resume/:id", (req, res) => {
  const session = loadSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }
  res.json(session);
});

app.post("/api/skin/moderate", async (req, res) => {
  try {
    const image = (req.body as { image?: string }).image;
    if (!image) {
      res.status(400).json({ error: "Image is required." });
      return;
    }
    if (image.length > 8_000_000) {
      res.status(413).json({ error: "Image is too large. Try a smaller photo." });
      return;
    }
    res.json(await moderateFaceImage(image));
  } catch (err) {
    if (isGeminiAccessBlocked(err)) {
      const image = (req.body as { image?: string }).image ?? "";
      const ok = image.startsWith("data:image/") && image.length > 80;
      res.json({ safe: ok, faceVisible: ok, issues: [], source: "fallback" });
      return;
    }
    res.status(500).json({ error: err instanceof Error ? err.message : "Moderation failed." });
  }
});

interface AnalyzeBody {
  front?: string;
  threeQuarter?: string;
  gender?: Gender;
  ageRange?: string;
  skinType?: string;
  sessionId?: string;
  answers?: QuizAnswer[];
}

app.post("/api/skin/analyze", async (req, res) => {
  const body = req.body as AnalyzeBody;
  try {
    if (!body.front) {
      res.status(400).json({ error: "A front photo is required." });
      return;
    }
    if (!hasGeminiKey()) {
      res.json(fallbackAnalysis(body.answers ?? []));
      return;
    }
    if (!body.gender) {
      res.status(400).json({ error: "Gender path is required." });
      return;
    }
    const analysis = await analyzeFaceImages({
      front: body.front,
      threeQuarter: body.threeQuarter,
      gender: body.gender,
      ageRange: body.ageRange ?? "",
      skinType: body.skinType ?? "",
      sessionId: body.sessionId ?? "",
    });
    res.json(analysis);
  } catch (err) {
    if (body.answers && isGeminiAccessBlocked(err)) {
      const fallback = fallbackAnalysis(body.answers);
      fallback.summary = geminiAccessHint(err);
      res.json(fallback);
      return;
    }
    if (body.answers) {
      const fallback = fallbackAnalysis(body.answers);
      fallback.summary = `Model unavailable — used deterministic fallback. ${err instanceof Error ? err.message : ""}`;
      res.json(fallback);
      return;
    }
    res.status(500).json({ error: err instanceof Error ? err.message : "Analysis failed." });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`[milc] server listening on http://localhost:${port}`);
  console.log(`[milc] Gemini model target: ${geminiModelId()}`);
  console.log(`[milc] AI mode: ${hasGeminiKey() ? "key set" : "fallback (no key)"}`);
});
