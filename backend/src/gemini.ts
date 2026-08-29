import type { Gender, ImageQuality, ModerationResult, SkinAIAnalysis, TraitFinding, TraitKey } from "@milc/shared";
import { emptyTrait } from "@milc/shared";

const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

function modelPreferences(): string[] {
  const env = process.env.GEMINI_MODEL;
  const defaults = [
    DEFAULT_GEMINI_MODEL,
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ];
  if (env) return [env, ...defaults.filter((d) => d !== env)];
  return defaults;
}

let lastSuccessfulModel: string | null = null;
/** Once a model succeeds, reuse it — do not burn quota cycling through every id. */
let cachedWorkingModel: string | null = null;
let cachedModelList: { ids: string[]; at: number } | null = null;
const MODEL_CACHE_MS = 5 * 60 * 1000;
const MAX_PROBE_ATTEMPTS = 6;
const MAX_MODEL_ATTEMPTS = 2;

const ANALYZER_PROMPT = `You are an expert dermatological computer vision analyzer. Your task is to evaluate uploaded image(s) of a user's face and accurately detect visible surface traits.

Analyze the image based strictly on these visual markers:
- Signs of Aging: Look for structural shadows, skin laxity, and creasing (fine lines, deep wrinkles).
- Uneven Skin Tone: Look for hyperpigmentation, melanin clusters, and sun spots.
- Signs of Congestion: Look for raised comedones, blackheads, whiteheads, and enlarged pores.
- Textural Irregularities: Look for uneven surface topography, indentations, and acne scarring.
- Look of Redness: Look for color saturation changes indicating erythema or localized flushing.
- Visible Shine: Look for high light reflection and glare indicating excess sebum.
- Eye Care: Look for orbital shadows (dark circles) and under-eye volume/puffiness.
- Dullness: Look for a lack of light return and matte/ashy undertones.

Handling Invisible Traits:
- Dryness & Dehydration: Only flag as true if physical flaking or scaling is visible.
- Barrier Support & Sensitive Skin: These are microscopic or sensory states. Flag as "requires_user_input" unless extreme, visible inflammation or scaling is present.
- Antioxidant Support: Because this is a universal preventative need without visual markers, always return "recommended" for this category.

Rules:
1. Do not diagnose medical conditions (e.g., do not say "rosacea", say "look of redness").
2. Rely strictly on pixel data (light, shadow, color contrast, texture).
3. NEVER recommend specific product names, brands, or regimens. Output ONLY the treatment pathway/active category (e.g., "BHA_Exfoliant", "Pigment_Inhibitor") so the application's backend can map the correct native product.

Allowed pathways only:
Retinoid_Pathway, Peptide_Support, Pigment_Inhibitor, BHA_Exfoliant, AHA_Exfoliant, Pore_Refiner, Soothing_Calm, Oil_Control, Brightening_Eye, Depuffing_Eye, Radiance_Boost, Hydration_Occlusive, Barrier_Repair, Antioxidant_Defense, Daily_SPF

Return ONLY valid JSON matching this schema:
{
  "overall_confidence": 0-100,
  "image_quality": {
    "lighting": "good" | "fair" | "poor",
    "focus": "good" | "fair" | "poor",
    "face_visibility": "full" | "partial" | "unclear"
  },
  "traits": {
    "signs_of_aging": { "status": true|false, "severity": "none|mild|moderate|pronounced", "confidence": 0-100, "markers": ["..."], "pathways": ["..."] },
    "uneven_skin_tone": { ... },
    "signs_of_congestion": { ... },
    "textural_irregularities": { ... },
    "look_of_redness": { ... },
    "visible_shine": { ... },
    "eye_care": { ... },
    "dullness": { ... },
    "dryness_dehydration": { ... },
    "barrier_support": { "status": true|false|"requires_user_input", ... },
    "antioxidant_support": { "status": "recommended", ... }
  },
  "summary": "1-2 sentences. Cosmetic surface language only. No diagnoses, no brand names."
}`;

const MODERATE_PROMPT = `You check whether a photo is appropriate for a cosmetic facial skin analysis.

Return ONLY JSON:
{
  "safe": boolean,
  "faceVisible": boolean,
  "issues": string[]
}

Rules:
- safe=false if the image is NSFW, sexual, violent, or not a real photograph.
- faceVisible=false if you cannot see a human face occupying a meaningful part of the frame.
- issues should be short, user-facing (e.g. "Face is cropped", "Too dark", "Sunglasses covering the face").
- Do not diagnose skin. Do not mention brands.`;

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function geminiModelId(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export function geminiModelInUse(): string | null {
  return lastSuccessfulModel;
}

export class GeminiApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

/** True when we should fall back instead of surfacing a raw Gemini error. */
export function isGeminiAccessBlocked(err: unknown): boolean {
  if (err instanceof GeminiApiError) {
    return err.status === 403 || err.status === 401 || err.status === 404 || err.status === 429;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /403|401|404|429|PERMISSION_DENIED|denied access|no longer available|not found|rate limit|quota/i.test(msg);
}

export function geminiAccessHint(err: unknown): string {
  if (err instanceof GeminiApiError && err.status === 403) {
    return "Google AI denied this project (403). Enable billing in AI Studio, create a new API key (or new project), or contact Google support. The quiz still works offline.";
  }
  if (err instanceof GeminiApiError && err.status === 404) {
    return `Model not found or retired for new users (404). Set GEMINI_MODEL=gemini-3-flash-preview in backend/.env — not gemini-2.5-flash.`;
  }
  if (err instanceof GeminiApiError && err.status === 429) {
    return "Gemini quota exceeded (429). Free tier is about 20 requests/day — wait until tomorrow, avoid refreshing /api/health repeatedly, or enable billing in AI Studio.";
  }
  return "Gemini was unavailable — results used your quiz answers instead of the photo.";
}

export async function listAvailableGeminiModels(): Promise<string[]> {
  if (cachedModelList && Date.now() - cachedModelList.at < MODEL_CACHE_MS) {
    return cachedModelList.ids;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) return [];

    const json = (await res.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };

    const ids = (json.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean)
      .filter(
        (id) =>
          /gemini/i.test(id) &&
          /flash/i.test(id) &&
          !/tts|image|live|embedding|robotics|native-audio|computer-use|omni|flash-lite|lite-latest|lite-preview|^gemini-2\.5-flash$/i.test(
            id,
          ),
      );

    cachedModelList = { ids, at: Date.now() };
    return ids;
  } catch {
    return [];
  }
}

function rankDiscoveredModels(ids: string[]): string[] {
  const ordered: string[] = [];
  for (const preferred of modelPreferences()) {
    if (ids.includes(preferred) && !ordered.includes(preferred)) ordered.push(preferred);
  }
  for (const id of ids.sort()) {
    if (!ordered.includes(id)) ordered.push(id);
  }
  return ordered;
}

async function modelChain(): Promise<string[]> {
  if (cachedWorkingModel) return [cachedWorkingModel];
  const discovered = await listAvailableGeminiModels();
  const ranked = discovered.length ? rankDiscoveredModels(discovered) : modelPreferences();
  return ranked.slice(0, MAX_MODEL_ATTEMPTS);
}

export async function probeGeminiAccess(): Promise<{
  reachable: boolean;
  quotaExceeded?: boolean;
  projectDenied?: boolean;
  model?: string;
  availableModels?: string[];
  modelsTried?: string[];
  error?: string;
}> {
  if (!hasGeminiKey()) {
    return { reachable: false, error: "GEMINI_API_KEY is not set" };
  }

  const availableModels = await listAvailableGeminiModels();
  const ranked = rankDiscoveredModels(
    availableModels.length ? availableModels : modelPreferences(),
  );
  const toTry = cachedWorkingModel ? [cachedWorkingModel] : ranked.slice(0, MAX_PROBE_ATTEMPTS);
  const failures: string[] = [];
  const modelsAttempted: string[] = [];

  for (const model of toTry) {
    modelsAttempted.push(model);
    try {
      await generateContentWithModelRetry(model, [{ text: 'Reply with JSON only: {"ok":true}' }]);
      cachedWorkingModel = model;
      return {
        reachable: true,
        model,
        availableModels,
        modelsTried: modelsAttempted,
      };
    } catch (err) {
      if (err instanceof GeminiApiError && err.status === 429) {
        return {
          reachable: false,
          quotaExceeded: true,
          availableModels,
          modelsTried: modelsAttempted,
          error: geminiAccessHint(err),
        };
      }
      if (err instanceof GeminiApiError && (err.status === 403 || err.status === 404)) {
        failures.push(`${model} (${err.status})`);
        cachedWorkingModel = null;
        continue;
      }
      return {
        reachable: false,
        availableModels,
        modelsTried: modelsAttempted,
        error: err instanceof Error ? err.message.slice(0, 320) : String(err),
      };
    }
  }

  const all403 = failures.length > 0 && failures.every((f) => f.includes("(403)"));
  return {
    reachable: false,
    projectDenied: all403,
    availableModels,
    modelsTried: modelsAttempted,
    error: all403
      ? geminiAccessHint(new GeminiApiError(403, "project denied"))
      : failures.length > 0
        ? `Models unavailable: ${failures.join(", ")}. Try GEMINI_MODEL=gemini-3.6-flash in backend/.env`
        : "No model to probe.",
  };
}

function offlineImageCheck(imageDataUrl: string): ModerationResult {
  const looksLikeImage = imageDataUrl.startsWith("data:image/") && imageDataUrl.length > 80;
  return {
    safe: looksLikeImage,
    faceVisible: looksLikeImage,
    issues: looksLikeImage ? [] : ["We could not read that file as an image."],
    source: "fallback",
  };
}

function dataUrlToInline(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function generateContentWithModel(
  model: string,
  parts: unknown[],
  jsonMode = true,
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(`${url}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: jsonMode
        ? { temperature: 0.2, responseMimeType: "application/json" }
        : { temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new GeminiApiError(res.status, `Gemini error ${res.status} (${model}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  lastSuccessfulModel = model;
  cachedWorkingModel = model;
  return text.trim();
}

/** Retry without JSON mode — structured output sometimes 403s on free tier. */
async function generateContentWithModelRetry(model: string, parts: unknown[]): Promise<string> {
  try {
    return await generateContentWithModel(model, parts, true);
  } catch (err) {
    if (err instanceof GeminiApiError && err.status === 403) {
      return await generateContentWithModel(model, parts, false);
    }
    throw err;
  }
}

async function generateContent(parts: unknown[]): Promise<string> {
  const tried = await modelChain();
  const failures: string[] = [];

  for (const model of tried) {
    try {
      return await generateContentWithModelRetry(model, parts);
    } catch (err) {
      if (err instanceof GeminiApiError && err.status === 429) {
        throw err;
      }
      if (err instanceof GeminiApiError && (err.status === 403 || err.status === 404)) {
        failures.push(`${model} (${err.status})`);
        console.warn(`[milc] Gemini model ${model} unavailable (${err.status}), trying next…`);
        cachedWorkingModel = null;
        continue;
      }
      throw err;
    }
  }

  throw new GeminiApiError(
    404,
    failures.length
      ? `No reachable Gemini model for this API key. Tried: ${failures.join(", ")}`
      : "No Gemini models configured. Set GEMINI_MODEL in backend/.env",
  );
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

const TRAIT_KEYS: TraitKey[] = [
  "signs_of_aging",
  "uneven_skin_tone",
  "signs_of_congestion",
  "textural_irregularities",
  "look_of_redness",
  "visible_shine",
  "eye_care",
  "dullness",
  "dryness_dehydration",
  "barrier_support",
  "antioxidant_support",
];

function normalizeFinding(key: TraitKey, raw: Partial<TraitFinding> | undefined): TraitFinding {
  const base = emptyTrait(key);
  if (!raw) return base;
  return {
    trait: key,
    status: (raw.status as TraitFinding["status"]) ?? base.status,
    severity: raw.severity ?? "none",
    confidence: Number.isFinite(raw.confidence) ? Number(raw.confidence) : 0,
    markers: Array.isArray(raw.markers) ? raw.markers.map(String).slice(0, 6) : [],
    pathways: Array.isArray(raw.pathways) ? (raw.pathways as TraitFinding["pathways"]) : [],
  };
}

export async function moderateFaceImage(imageDataUrl: string): Promise<ModerationResult> {
  if (!hasGeminiKey()) {
    return offlineImageCheck(imageDataUrl);
  }

  const inline = dataUrlToInline(imageDataUrl);
  if (!inline) {
    return {
      safe: false,
      faceVisible: false,
      issues: ["Unsupported image format."],
      source: "fallback",
    };
  }

  try {
    const raw = await generateContent([
      { text: MODERATE_PROMPT },
      { inlineData: { mimeType: inline.mimeType, data: inline.data } },
    ]);
    const parsed = parseJson<Omit<ModerationResult, "source">>(raw);
    return {
      safe: Boolean(parsed.safe),
      faceVisible: Boolean(parsed.faceVisible),
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      source: "gemini",
    };
  } catch (err) {
    if (isGeminiAccessBlocked(err)) {
      console.warn("[milc] Gemini moderation unavailable:", err instanceof Error ? err.message : err);
      return offlineImageCheck(imageDataUrl);
    }
    throw err;
  }
}

export async function analyzeFaceImages(input: {
  front: string;
  threeQuarter?: string | null;
  gender: Gender;
  ageRange: string;
  skinType: string;
  sessionId: string;
}): Promise<SkinAIAnalysis> {
  const parts: unknown[] = [
    {
      text: `${ANALYZER_PROMPT}

Context (do not let this override pixels; it is only for framing):
- gender_path: ${input.gender}
- age_range: ${input.ageRange}
- self_reported_skin_type: ${input.skinType}
- session_id: ${input.sessionId}
Image 1 is a front-facing photo. ${input.threeQuarter ? "Image 2 is a 45-degree three-quarter photo." : "Only one image was provided."}`,
    },
  ];

  const front = dataUrlToInline(input.front);
  if (!front) {
    throw new Error("Front image is not a valid data URL");
  }
  parts.push({ inlineData: { mimeType: front.mimeType, data: front.data } });

  if (input.threeQuarter) {
    const side = dataUrlToInline(input.threeQuarter);
    if (side) {
      parts.push({ inlineData: { mimeType: side.mimeType, data: side.data } });
    }
  }

  const raw = await generateContent(parts);
  const parsed = parseJson<{
    overall_confidence?: number;
    image_quality?: Partial<ImageQuality>;
    traits?: Partial<Record<TraitKey, Partial<TraitFinding>>>;
    summary?: string;
  }>(raw);

  const traits = {} as SkinAIAnalysis["traits"];
  for (const key of TRAIT_KEYS) {
    traits[key] = normalizeFinding(key, parsed.traits?.[key]);
  }
  traits.antioxidant_support = {
    ...traits.antioxidant_support,
    status: "recommended",
    pathways: traits.antioxidant_support.pathways.length
      ? traits.antioxidant_support.pathways
      : ["Antioxidant_Defense"],
  };
  if (
    traits.dryness_dehydration.status === true &&
    traits.dryness_dehydration.markers.every((m) => !/flak|scal/i.test(m))
  ) {
    traits.dryness_dehydration.markers.push(
      "Flagged only because flaking/scaling language was implied by the model",
    );
  }
  if (traits.barrier_support.status !== true) {
    traits.barrier_support.status = "requires_user_input";
  }

  return {
    overall_confidence: Math.max(0, Math.min(100, Number(parsed.overall_confidence ?? 0))),
    image_quality: {
      lighting: parsed.image_quality?.lighting ?? "fair",
      focus: parsed.image_quality?.focus ?? "fair",
      face_visibility: parsed.image_quality?.face_visibility ?? "full",
    },
    traits,
    summary:
      parsed.summary?.trim() ||
      "Surface traits were read from light, shadow, and texture only.",
    source: "gemini",
  };
}
