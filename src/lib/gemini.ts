import type { Gender, ImageQuality, ModerationResult, SkinAIAnalysis, TraitFinding, TraitKey } from "./types";
import { emptyTrait } from "./types";

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

function dataUrlToInline(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function generateContent(parts: unknown[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text.slice(0, 240)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return text.trim();
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
    const looksLikeImage = imageDataUrl.startsWith("data:image/") && imageDataUrl.length > 80;
    return {
      safe: looksLikeImage,
      faceVisible: looksLikeImage,
      issues: looksLikeImage ? [] : ["We could not read that file as an image."],
      source: "fallback",
    };
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
