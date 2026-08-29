import { describe, expect, it } from "vitest";
import {
  deriveFactors,
  fallbackAnalysis,
  generateResult,
  reconcileTraits,
  selfReportedTraits,
} from "@milc/shared";
import { questionsFor } from "@milc/shared";
import type { QuizAnswer, QuizState, SkinAIAnalysis, TraitFinding, TraitKey } from "@milc/shared";
import { EMPTY_ABOUT_ME, emptyTrait } from "@milc/shared";

function ans(id: string, value: string | string[], gender: "female" | "male" = "female"): QuizAnswer {
  return { section: 1, question_id: id, gender_path: gender, value };
}

function trait(key: TraitKey, patch: Partial<TraitFinding>): TraitFinding {
  return { ...emptyTrait(key), ...patch, trait: key };
}

function analysis(
  partial: Partial<Record<TraitKey, Partial<TraitFinding>>> = {},
  confidence = 82,
): SkinAIAnalysis {
  const keys: TraitKey[] = [
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
  const traits = {} as SkinAIAnalysis["traits"];
  for (const key of keys) {
    traits[key] = trait(key, partial[key] ?? {});
  }
  traits.antioxidant_support = trait("antioxidant_support", {
    status: "recommended",
    pathways: ["Antioxidant_Defense"],
    ...partial.antioxidant_support,
  });
  return {
    overall_confidence: confidence,
    image_quality: { lighting: "good", focus: "good", face_visibility: "full" },
    traits,
    summary: "Test analysis",
    source: "gemini",
  };
}

function baseState(over: Partial<QuizState> = {}): QuizState {
  return {
    sessionId: "test-session",
    aboutMe: {
      ...EMPTY_ABOUT_ME,
      fullName: "Maya Shah",
      whatsapp: "9876543210",
      email: "maya@example.com",
      ageRange: "25-34",
      gender: "female",
      skinType: "combination",
    },
    answers: [],
    faceImages: { front: null, threeQuarter: null },
    aiAnalysis: null,
    result: null,
    currentSection: 3,
    currentStep: 0,
    privacyAccepted: true,
    photoConsent: true,
    ...over,
  };
}

describe("questionsFor", () => {
  it("gives six skin-profile questions on both gender paths", () => {
    expect(questionsFor(1, "female")).toHaveLength(6);
    expect(questionsFor(1, "male")).toHaveLength(6);
  });

  it("gives 10 lifestyle questions for female and 8 for male", () => {
    expect(questionsFor(2, "female")).toHaveLength(10);
    expect(questionsFor(2, "male")).toHaveLength(8);
  });
});

describe("selfReportedTraits", () => {
  it("maps concern values and ignores baseline", () => {
    const traits = selfReportedTraits([
      ans("primary_concerns", ["pigment", "baseline", "eyes"]),
    ]);
    expect(traits).toEqual(["uneven_skin_tone", "eye_care"]);
  });
});

describe("reconcileTraits", () => {
  it("uses self-report labels when there is no AI (answers-only path)", () => {
    const { traits, lowConfidence } = reconcileTraits(
      [ans("primary_concerns", ["aging", "dullness"])],
      null,
    );
    const aging = traits.find((t) => t.trait === "signs_of_aging");
    expect(aging?.source).toBe("self_report");
    expect(aging?.status).toBe(true);
    expect(lowConfidence).toBe(false);
    expect(traits.find((t) => t.trait === "antioxidant_support")?.status).toBe("recommended");
  });

  it("marks low confidence when AI is under 70%", () => {
    const { lowConfidence, mismatchNotes } = reconcileTraits([], analysis({}, 55));
    expect(lowConfidence).toBe(true);
    expect(mismatchNotes[0]).toMatch(/70%/);
  });

  it("keeps self-reported dryness when the photo shows no flaking", () => {
    const { traits, mismatchNotes } = reconcileTraits(
      [ans("primary_concerns", ["dryness"])],
      analysis({
        dryness_dehydration: { status: false, severity: "none", confidence: 80 },
      }),
    );
    const dry = traits.find((t) => t.trait === "dryness_dehydration");
    expect(dry?.status).toBe(true);
    expect(dry?.source).toBe("self_report");
    expect(mismatchNotes.join(" ")).toMatch(/flaking/i);
  });

  it("takes barrier from user input unless the photo shows extreme inflammation", () => {
    const mild = reconcileTraits([ans("sensitivity", "yes")], analysis({}));
    expect(mild.traits.find((t) => t.trait === "barrier_support")?.source).toBe("user_input");
    expect(mild.traits.find((t) => t.trait === "barrier_support")?.status).toBe(true);

    const extreme = reconcileTraits(
      [ans("sensitivity", "no")],
      analysis({
        barrier_support: {
          status: true,
          severity: "pronounced",
          confidence: 88,
          markers: ["visible scaling"],
        },
      }),
    );
    expect(extreme.traits.find((t) => t.trait === "barrier_support")?.source).toBe("ai");
  });
});

describe("deriveFactors", () => {
  it("returns at most three ranked factors", () => {
    const factors = deriveFactors({
      aboutMe: baseState().aboutMe,
      answers: [
        ans("sun_habits", "rarely"),
        ans("stress", "high"),
        ans("sleep", "poor"),
        ans("life_stage", "peri"),
        ans("water", "low"),
        ans("primary_concerns", ["pigment", "aging"]),
      ],
    });
    expect(factors.length).toBeLessThanOrEqual(3);
    expect(factors[0].tag).toBe("uv");
  });
});

describe("generateResult", () => {
  it("never emits product or brand names in pathway output", () => {
    const result = generateResult(
      baseState({
        answers: [
          ans("primary_concerns", ["pigment", "congestion"]),
          ans("sun_habits", "outdoors"),
          ans("sensitivity", "sometimes"),
        ],
      }),
      analysis({
        uneven_skin_tone: {
          status: true,
          severity: "moderate",
          confidence: 84,
          pathways: ["Pigment_Inhibitor"],
        },
        signs_of_congestion: {
          status: true,
          severity: "mild",
          confidence: 77,
          pathways: ["BHA_Exfoliant"],
        },
      }),
    );
    const blob = JSON.stringify(result);
    expect(blob).not.toMatch(/cerave|ordinary|la roche|neutrogena|olay/i);
    expect(
      result.recommendations.some(
        (r) => r.pathway === "Pigment_Inhibitor" || r.pathway === "BHA_Exfoliant",
      ),
    ).toBe(true);
    expect(result.recommendations.length).toBeLessThanOrEqual(4);
    expect(result.recommendations.some((r) => r.pathway === "Daily_SPF")).toBe(true);
  });
});

describe("fallbackAnalysis", () => {
  it("always recommends antioxidant support and leaves barrier to the user", () => {
    const fb = fallbackAnalysis([ans("primary_concerns", ["shine"])]);
    expect(fb.source).toBe("fallback");
    expect(fb.traits.antioxidant_support.status).toBe("recommended");
    expect(fb.traits.barrier_support.status).toBe("requires_user_input");
    expect(fb.traits.visible_shine.status).toBe(true);
    expect(fb.overall_confidence).toBeLessThan(70);
  });
});
