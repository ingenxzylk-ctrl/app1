import { CONCERN_TO_TRAIT, PATHWAY_COPY } from "./questions";
import type {
  ContributingFactor,
  FactorTag,
  QuizAnswer,
  QuizResult,
  QuizState,
  ReconciledTrait,
  Severity,
  SkinAIAnalysis,
  TraitFinding,
  TraitKey,
  TraitStatus,
  TreatmentPathway,
} from "./types";
import { TRAIT_LABELS, emptyTrait } from "./types";

const VISUAL_TRAITS: TraitKey[] = [
  "signs_of_aging",
  "uneven_skin_tone",
  "signs_of_congestion",
  "textural_irregularities",
  "look_of_redness",
  "visible_shine",
  "eye_care",
  "dullness",
  "dryness_dehydration",
];

const LOW_CONFIDENCE = 70;

function answerValue(answers: QuizAnswer[], id: string): string | string[] | undefined {
  return answers.find((a) => a.question_id === id)?.value;
}

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function isActive(status: TraitStatus): boolean {
  return status === true || status === "recommended";
}

function severityRank(severity: Severity): number {
  return { none: 0, mild: 1, moderate: 2, pronounced: 3 }[severity];
}

export function selfReportedTraits(answers: QuizAnswer[]): TraitKey[] {
  const concerns = asList(answerValue(answers, "primary_concerns")).filter(
    (c) => c !== "baseline",
  );
  return concerns
    .map((c) => CONCERN_TO_TRAIT[c])
    .filter((t): t is TraitKey => Boolean(t));
}

export function deriveFactors(state: Pick<QuizState, "answers" | "aboutMe">): ContributingFactor[] {
  const { answers, aboutMe } = state;
  const factors: ContributingFactor[] = [];

  const sun = answerValue(answers, "sun_habits");
  if (sun === "rarely" || sun === "outdoors" || sun === "sometimes") {
    factors.push({
      tag: "uv",
      label: "UV exposure",
      detail:
        sun === "outdoors"
          ? "Frequent outdoor time without consistent SPF shows up as tone and texture change."
          : "Inconsistent SPF is a common driver of uneven tone and the look of aging.",
    });
  }

  const stress = answerValue(answers, "stress");
  if (stress === "high" || stress === "moderate") {
    factors.push({
      tag: "stress",
      label: "Daily stress",
      detail: "Elevated stress often tracks with shine, dullness, and a flushed look.",
    });
  }

  const sleep = answerValue(answers, "sleep");
  if (sleep === "poor" || sleep === "inconsistent") {
    factors.push({
      tag: "sleep",
      label: "Sleep debt",
      detail: "Short or broken sleep commonly shows as orbital shadows and a matte, tired surface.",
    });
  }

  const lifeStage = answerValue(answers, "life_stage");
  const cycle = answerValue(answers, "cycle_skin");
  if (
    aboutMe.gender === "female" &&
    (["pregnancy", "postpartum", "peri", "meno"].includes(String(lifeStage)) ||
      cycle === "yes" ||
      cycle === "sometimes")
  ) {
    factors.push({
      tag: "hormones",
      label: "Hormonal context",
      detail: "Life stage and cycle shifts can change oil, tone, and the look of congestion.",
    });
  }

  const water = answerValue(answers, "water");
  const diet = answerValue(answers, "diet");
  if (water === "low" || diet === "irregular") {
    factors.push({
      tag: "dehydration",
      label: "Hydration & meals",
      detail: "Low water intake or irregular meals can flatten light return and increase tightness.",
    });
  }

  const food = answerValue(answers, "food_habits");
  if (food === "daily") {
    factors.push({
      tag: "diet",
      label: "Rich / high-sugar meals",
      detail: "Frequent rich meals can coincide with a more congested, less even-looking surface.",
    });
  }

  const env = answerValue(answers, "environment");
  if (env === "dry_ac" || env === "polluted") {
    factors.push({
      tag: "environment",
      label: env === "polluted" ? "Urban environment" : "Dry indoor air",
      detail:
        env === "polluted"
          ? "Pollution load is a frequent companion to dullness and uneven tone."
          : "Dry or conditioned air often shows as tightness and a lack of glow.",
    });
  }

  const shave = answerValue(answers, "shave");
  if (shave === "irritating" || shave === "sometimes") {
    factors.push({
      tag: "shaving",
      label: "Shave friction",
      detail: "Repeated shave pass-overs can leave a flushed look and raised congestion.",
    });
  }

  const sensitivity = answerValue(answers, "sensitivity");
  if (sensitivity === "yes" || sensitivity === "sometimes") {
    factors.push({
      tag: "sensitivity",
      label: "Reactive surface",
      detail: "You told us products often sting or flush — barrier support is from your input, not the photo.",
    });
  }

  const concerns = asList(answerValue(answers, "primary_concerns"));
  if (concerns.includes("congestion")) {
    factors.push({
      tag: "congestion",
      label: "Surface congestion",
      detail: "Self-reported congestion guides the BHA / pore pathway even when lighting is imperfect.",
    });
  }
  if (concerns.includes("pigment")) {
    factors.push({
      tag: "pigment",
      label: "Uneven tone",
      detail: "You flagged melanin clustering — we keep this in the map even if the scan is conservative.",
    });
  }
  if (concerns.includes("aging")) {
    factors.push({
      tag: "aging",
      label: "Visible creasing",
      detail: "Self-reported lines and laxity inform the retinoid / peptide pathway.",
    });
  }

  const priority: FactorTag[] = [
    "uv",
    "hormones",
    "sensitivity",
    "stress",
    "sleep",
    "shaving",
    "environment",
    "dehydration",
    "diet",
    "congestion",
    "pigment",
    "aging",
  ];

  return priority
    .map((tag) => factors.find((f) => f.tag === tag))
    .filter((f): f is ContributingFactor => Boolean(f))
    .slice(0, 3);
}

function defaultPathways(trait: TraitKey): TreatmentPathway[] {
  switch (trait) {
    case "signs_of_aging":
      return ["Retinoid_Pathway", "Peptide_Support"];
    case "uneven_skin_tone":
      return ["Pigment_Inhibitor", "Daily_SPF"];
    case "signs_of_congestion":
      return ["BHA_Exfoliant", "Pore_Refiner"];
    case "textural_irregularities":
      return ["AHA_Exfoliant"];
    case "look_of_redness":
      return ["Soothing_Calm"];
    case "visible_shine":
      return ["Oil_Control"];
    case "eye_care":
      return ["Brightening_Eye", "Depuffing_Eye"];
    case "dullness":
      return ["Radiance_Boost"];
    case "dryness_dehydration":
      return ["Hydration_Occlusive"];
    case "barrier_support":
      return ["Barrier_Repair"];
    case "antioxidant_support":
      return ["Antioxidant_Defense"];
    default:
      return [];
  }
}

export function reconcileTraits(
  answers: QuizAnswer[],
  analysis: SkinAIAnalysis | null,
): { traits: ReconciledTrait[]; mismatchNotes: string[]; lowConfidence: boolean } {
  const reported = new Set(selfReportedTraits(answers));
  const sensitivity = answerValue(answers, "sensitivity");
  const mismatchNotes: string[] = [];
  const lowConfidence = Boolean(analysis && analysis.overall_confidence < LOW_CONFIDENCE);

  if (analysis && lowConfidence) {
    mismatchNotes.push(
      "Scan confidence is under 70%. Treat the visual read as an estimated range and lean on what you reported.",
    );
  }

  const traits: ReconciledTrait[] = VISUAL_TRAITS.map((key) => {
    const selfOn = reported.has(key);

    if (!analysis) {
      return {
        trait: key,
        label: TRAIT_LABELS[key],
        status: selfOn,
        severity: selfOn ? "mild" : "none",
        confidence: selfOn ? 40 : 0,
        source: "self_report",
        note: selfOn ? "From your answers — no face scan on this path." : undefined,
        pathways: selfOn ? defaultPathways(key) : [],
      };
    }

    const ai = analysis.traits[key];
    const aiOn = isActive(ai.status);

    if (aiOn && selfOn) {
      return {
        trait: key,
        label: TRAIT_LABELS[key],
        status: true,
        severity: ai.severity,
        confidence: ai.confidence,
        source: "reconciled",
        pathways: ai.pathways.length ? ai.pathways : defaultPathways(key),
      };
    }

    if (aiOn && !selfOn) {
      return {
        trait: key,
        label: TRAIT_LABELS[key],
        status: true,
        severity: ai.severity,
        confidence: ai.confidence,
        source: "ai",
        note: "Visible on the scan; you didn’t flag this yourself.",
        pathways: ai.pathways.length ? ai.pathways : defaultPathways(key),
      };
    }

    if (!aiOn && selfOn) {
      if (key === "dryness_dehydration") {
        mismatchNotes.push(
          "Dryness is only confirmed from a photo when flaking or scaling is visible. We kept your self-report.",
        );
      } else {
        mismatchNotes.push(
          `${TRAIT_LABELS[key]} was self-reported and not clearly visible on the scan.`,
        );
      }
      return {
        trait: key,
        label: TRAIT_LABELS[key],
        status: true,
        severity: "mild",
        confidence: Math.min(ai?.confidence ?? 45, 55),
        source: "self_report",
        note: "Self-reported — not visually confirmed on this scan.",
        pathways: defaultPathways(key),
      };
    }

    return {
      trait: key,
      label: TRAIT_LABELS[key],
      status: false,
      severity: "none",
      confidence: ai?.confidence ?? 0,
      source: "ai",
      pathways: [],
    };
  });

  const barrierFromUser =
    sensitivity === "yes" ? true : sensitivity === "sometimes" ? "requires_user_input" : false;
  const aiBarrier = analysis?.traits.barrier_support;
  const extremeBarrier = aiBarrier?.status === true && severityRank(aiBarrier.severity) >= 2;

  traits.push({
    trait: "barrier_support",
    label: TRAIT_LABELS.barrier_support,
    status: extremeBarrier ? true : barrierFromUser,
    severity: extremeBarrier ? aiBarrier!.severity : sensitivity === "yes" ? "moderate" : "none",
    confidence: extremeBarrier ? aiBarrier!.confidence : 90,
    source: extremeBarrier ? "ai" : "user_input",
    note: extremeBarrier
      ? "Visible inflammation or scaling was strong enough to flag from the photo."
      : "Barrier and sensitive skin are sensory states — this flag comes from you, not pixels.",
    pathways: extremeBarrier || barrierFromUser === true ? ["Barrier_Repair"] : [],
  });

  const antioxidant = analysis?.traits.antioxidant_support;
  traits.push({
    trait: "antioxidant_support",
    label: TRAIT_LABELS.antioxidant_support,
    status: "recommended",
    severity: "mild",
    confidence: 100,
    source: "always_on",
    note: "A universal preventative need without a visual marker.",
    pathways: antioxidant?.pathways.length
      ? antioxidant.pathways
      : ["Antioxidant_Defense"],
  });

  const uniqueNotes = [...new Set(mismatchNotes)].slice(0, 3);
  return { traits, mismatchNotes: uniqueNotes, lowConfidence };
}

function pickRecommendations(
  traits: ReconciledTrait[],
  answers: QuizAnswer[],
): QuizResult["recommendations"] {
  const sun = answerValue(answers, "sun_habits");
  const ranked: { pathway: TreatmentPathway; reason: string; weight: number }[] = [];

  for (const trait of traits) {
    if (!isActive(trait.status) && trait.status !== "requires_user_input") continue;
    if (trait.status === "requires_user_input") continue;
    const weight = 10 + severityRank(trait.severity) * 4 + (trait.source === "reconciled" ? 3 : 0);
    for (const pathway of trait.pathways) {
      ranked.push({
        pathway,
        reason: `${PATHWAY_COPY[pathway].defaultReason} Linked to ${trait.label.toLowerCase()}.`,
        weight,
      });
    }
  }

  if (sun === "rarely" || sun === "outdoors" || sun === "sometimes") {
    ranked.push({
      pathway: "Daily_SPF",
      reason: PATHWAY_COPY.Daily_SPF.defaultReason,
      weight: 18,
    });
  } else {
    ranked.push({
      pathway: "Daily_SPF",
      reason: "Keep daily SPF in the map — every facial analysis still ends here.",
      weight: 8,
    });
  }

  const seen = new Set<TreatmentPathway>();
  const unique: typeof ranked = [];
  for (const item of ranked.sort((a, b) => b.weight - a.weight)) {
    if (seen.has(item.pathway)) continue;
    seen.add(item.pathway);
    unique.push(item);
  }

  return unique.slice(0, 4).map((item) => ({
    pathway: item.pathway,
    title: PATHWAY_COPY[item.pathway].title,
    reason: item.reason,
  }));
}

function outlookFor(traits: ReconciledTrait[], gender: QuizState["aboutMe"]["gender"]): string {
  const active = traits.filter((t) => t.status === true);
  const pronounced = active.filter((t) => t.severity === "pronounced");
  const hasAging = active.some((t) => t.trait === "signs_of_aging");
  const hasPigment = active.some((t) => t.trait === "uneven_skin_tone");
  const hasCongestion = active.some((t) => t.trait === "signs_of_congestion");

  if (active.length <= 1) {
    return gender === "male"
      ? "Surface markers look quiet — this is a strong moment for preventive care rather than correction."
      : "Your surface read is calm. This is an excellent window for prevention and keeping glow steady.";
  }
  if (pronounced.length >= 2) {
    return "A few markers are more visible, and they still respond well to a short, consistent pathway — not an overhaul.";
  }
  if (hasCongestion && hasPigment) {
    return "Congestion and uneven tone often travel together. Clearing the surface first usually makes tone work more even.";
  }
  if (hasAging && hasPigment) {
    return "Lines and tone shifts are common companions of light exposure. Both are gradual, hopeful categories — consistency beats intensity.";
  }
  if (hasCongestion) {
    return "Congestion is one of the more responsive surface traits. A measured BHA pathway is usually enough to start.";
  }
  return "Nothing here requires alarm. The markers we see are cosmetic surface traits, and they typically settle with a focused pathway.";
}

function headlineFor(traits: ReconciledTrait[]): { headline: string; skinLabel: string } {
  const active = traits
    .filter((t) => t.status === true)
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  if (active.length === 0) {
    return {
      headline: "A calm, even-looking surface",
      skinLabel: "Baseline / preventive",
    };
  }

  const top = active[0];
  const labels: Record<TraitKey, string> = {
    signs_of_aging: "Early structural shadows",
    uneven_skin_tone: "Uneven tone pattern",
    signs_of_congestion: "Congested T-zone pattern",
    textural_irregularities: "Textural irregularity pattern",
    look_of_redness: "Flushed-look pattern",
    visible_shine: "High-shine pattern",
    eye_care: "Orbital shadow pattern",
    dullness: "Low light-return pattern",
    dryness_dehydration: "Visible flaking pattern",
    barrier_support: "Reactive-surface pattern",
    antioxidant_support: "Preventive pattern",
  };

  return {
    headline: `Your scan highlights ${top.label.toLowerCase()}`,
    skinLabel: labels[top.trait],
  };
}

export function generateResult(
  state: QuizState,
  analysis?: SkinAIAnalysis | null,
): QuizResult {
  const resolved = analysis ?? state.aiAnalysis;
  const { traits, mismatchNotes, lowConfidence } = reconcileTraits(state.answers, resolved);
  const factors = deriveFactors(state);
  const recommendations = pickRecommendations(traits, state.answers);
  const { headline, skinLabel } = headlineFor(traits);

  return {
    headline,
    skinLabel,
    outlook: outlookFor(traits, state.aboutMe.gender),
    overallConfidence: resolved?.overall_confidence ?? 0,
    lowConfidence,
    mismatchNotes,
    traits,
    factors,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

export function fallbackAnalysis(answers: QuizAnswer[]): SkinAIAnalysis {
  const reported = new Set(selfReportedTraits(answers));
  const traits = {} as SkinAIAnalysis["traits"];

  const all: TraitKey[] = [
    ...VISUAL_TRAITS,
    "barrier_support",
    "antioxidant_support",
  ];

  for (const key of all) {
    const on = reported.has(key);
    const finding: TraitFinding = {
      ...emptyTrait(key, key === "antioxidant_support" ? "recommended" : on),
      severity: on ? "mild" : "none",
      confidence: on ? 48 : 35,
      markers: on ? ["Mapped from self-report (offline fallback)"] : [],
      pathways: key === "antioxidant_support" || on ? defaultPathways(key) : [],
    };
    if (key === "barrier_support") {
      finding.status = "requires_user_input";
      finding.markers = ["Sensory trait — not inferred from pixels"];
      finding.pathways = [];
    }
    if (key === "antioxidant_support") {
      finding.status = "recommended";
      finding.severity = "mild";
      finding.confidence = 100;
      finding.markers = ["Universal preventative — no visual marker"];
      finding.pathways = ["Antioxidant_Defense"];
    }
    traits[key] = finding;
  }

  return {
    overall_confidence: 45,
    image_quality: {
      lighting: "fair",
      focus: "fair",
      face_visibility: "full",
    },
    traits,
    summary:
      "Offline fallback used. Visual markers were not read by a model; findings follow your answers plus the always-on antioxidant pathway.",
    source: "fallback",
  };
}
