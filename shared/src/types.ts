export type Gender = "female" | "male";

export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55+";

export type SkinType =
  | "oily"
  | "dry"
  | "combination"
  | "normal"
  | "sensitive"
  | "not_sure";

export type TraitKey =
  | "signs_of_aging"
  | "uneven_skin_tone"
  | "signs_of_congestion"
  | "textural_irregularities"
  | "look_of_redness"
  | "visible_shine"
  | "eye_care"
  | "dullness"
  | "dryness_dehydration"
  | "barrier_support"
  | "antioxidant_support";

export type TraitStatus = true | false | "requires_user_input" | "recommended";

export type Severity = "none" | "mild" | "moderate" | "pronounced";

export type TreatmentPathway =
  | "Retinoid_Pathway"
  | "Peptide_Support"
  | "Pigment_Inhibitor"
  | "BHA_Exfoliant"
  | "AHA_Exfoliant"
  | "Pore_Refiner"
  | "Soothing_Calm"
  | "Oil_Control"
  | "Brightening_Eye"
  | "Depuffing_Eye"
  | "Radiance_Boost"
  | "Hydration_Occlusive"
  | "Barrier_Repair"
  | "Antioxidant_Defense"
  | "Daily_SPF";

export interface AboutMe {
  fullName: string;
  whatsappCountry: string;
  whatsapp: string;
  email: string;
  ageRange: AgeRange | "";
  gender: Gender | "";
  skinType: SkinType | "";
}

export interface QuizAnswer {
  section: number;
  question_id: string;
  gender_path: Gender;
  value: string | string[];
}

export interface FaceImages {
  front: string | null;
  threeQuarter: string | null;
}

export interface TraitFinding {
  trait: TraitKey;
  status: TraitStatus;
  severity: Severity;
  confidence: number;
  markers: string[];
  pathways: TreatmentPathway[];
}

export interface ImageQuality {
  lighting: "good" | "fair" | "poor";
  focus: "good" | "fair" | "poor";
  face_visibility: "full" | "partial" | "unclear";
}

export interface SkinAIAnalysis {
  overall_confidence: number;
  image_quality: ImageQuality;
  traits: Record<TraitKey, TraitFinding>;
  summary: string;
  source: "gemini" | "fallback";
}

export type FactorTag =
  | "uv"
  | "stress"
  | "sleep"
  | "hormones"
  | "dehydration"
  | "environment"
  | "shaving"
  | "sensitivity"
  | "diet"
  | "congestion"
  | "pigment"
  | "aging";

export interface ContributingFactor {
  tag: FactorTag;
  label: string;
  detail: string;
}

export interface PathwayRecommendation {
  pathway: TreatmentPathway;
  title: string;
  reason: string;
}

export interface ReconciledTrait {
  trait: TraitKey;
  label: string;
  status: TraitStatus;
  severity: Severity;
  confidence: number;
  source: "ai" | "self_report" | "user_input" | "always_on" | "reconciled";
  note?: string;
  pathways: TreatmentPathway[];
}

export interface QuizResult {
  headline: string;
  skinLabel: string;
  outlook: string;
  overallConfidence: number;
  lowConfidence: boolean;
  mismatchNotes: string[];
  traits: ReconciledTrait[];
  factors: ContributingFactor[];
  recommendations: PathwayRecommendation[];
  generatedAt: string;
}

export interface QuizState {
  sessionId: string;
  aboutMe: AboutMe;
  answers: QuizAnswer[];
  faceImages: FaceImages;
  aiAnalysis: SkinAIAnalysis | null;
  result: QuizResult | null;
  currentSection: number;
  currentStep: number;
  privacyAccepted: boolean;
  photoConsent: boolean;
}

export interface ModerationResult {
  safe: boolean;
  faceVisible: boolean;
  issues: string[];
  source: "gemini" | "fallback";
}

export const TRAIT_LABELS: Record<TraitKey, string> = {
  signs_of_aging: "Signs of aging",
  uneven_skin_tone: "Uneven skin tone",
  signs_of_congestion: "Signs of congestion",
  textural_irregularities: "Textural irregularities",
  look_of_redness: "Look of redness",
  visible_shine: "Visible shine",
  eye_care: "Eye care",
  dullness: "Dullness",
  dryness_dehydration: "Dryness & dehydration",
  barrier_support: "Barrier support",
  antioxidant_support: "Antioxidant support",
};

export const EMPTY_ABOUT_ME: AboutMe = {
  fullName: "",
  whatsappCountry: "+91",
  whatsapp: "",
  email: "",
  ageRange: "",
  gender: "",
  skinType: "",
};

export function emptyTrait(trait: TraitKey, status: TraitStatus = false): TraitFinding {
  return {
    trait,
    status,
    severity: "none",
    confidence: 0,
    markers: [],
    pathways: [],
  };
}
