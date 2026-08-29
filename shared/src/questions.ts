import type { Gender, TreatmentPathway } from "./types";

export interface Choice {
  value: string;
  label: string;
  hint?: string;
}

export interface QuestionDef {
  id: string;
  section: number;
  prompt: string;
  help?: string;
  type: "single" | "multi";
  options: Choice[];
}

export const AGE_OPTIONS: Choice[] = [
  { value: "18-24", label: "18–24" },
  { value: "25-34", label: "25–34" },
  { value: "35-44", label: "35–44" },
  { value: "45-54", label: "45–54" },
  { value: "55+", label: "55+" },
];

export const SKIN_TYPE_OPTIONS: Choice[] = [
  { value: "oily", label: "Oily", hint: "Shine through the day, especially T-zone" },
  { value: "dry", label: "Dry", hint: "Tightness, less glow by evening" },
  { value: "combination", label: "Combination", hint: "Oily T-zone, drier cheeks" },
  { value: "normal", label: "Balanced", hint: "Comfortable most of the day" },
  { value: "sensitive", label: "Easily reactive", hint: "Stings or flushes with new products" },
  { value: "not_sure", label: "Not sure", hint: "We’ll infer from your scan + answers" },
];

export const COUNTRY_CODES: Choice[] = [
  { value: "+91", label: "IN +91" },
  { value: "+1", label: "US +1" },
  { value: "+44", label: "UK +44" },
  { value: "+971", label: "AE +971" },
  { value: "+65", label: "SG +65" },
  { value: "+61", label: "AU +61" },
  { value: "+49", label: "DE +49" },
  { value: "+33", label: "FR +33" },
];

export const CONCERN_OPTIONS_FEMALE: Choice[] = [
  { value: "aging", label: "Fine lines or creasing" },
  { value: "pigment", label: "Uneven tone or dark spots" },
  { value: "congestion", label: "Congestion or breakouts" },
  { value: "texture", label: "Rough texture or indentations" },
  { value: "redness", label: "Look of redness or flushing" },
  { value: "shine", label: "Visible shine" },
  { value: "eyes", label: "Under-eye shadows or puffiness" },
  { value: "dullness", label: "Dull or ashy look" },
  { value: "dryness", label: "Flaking or tightness" },
  { value: "baseline", label: "None — I want a baseline read" },
];

export const CONCERN_OPTIONS_MALE: Choice[] = [
  { value: "aging", label: "Fine lines or creasing" },
  { value: "pigment", label: "Uneven tone or sun spots" },
  { value: "congestion", label: "Congestion, blackheads, or shave bumps" },
  { value: "texture", label: "Uneven texture or marks" },
  { value: "redness", label: "Look of redness after shaving" },
  { value: "shine", label: "Visible shine or oil" },
  { value: "eyes", label: "Under-eye shadows or puffiness" },
  { value: "dullness", label: "Dull or tired look" },
  { value: "dryness", label: "Flaking or tightness" },
  { value: "baseline", label: "None — I want a baseline read" },
];

export const FEMALE_SKIN_QUESTIONS: QuestionDef[] = [
  {
    id: "primary_concerns",
    section: 1,
    prompt: "What do you notice most on the surface of your skin?",
    help: "Select everything that feels true. This is not a diagnosis.",
    type: "multi",
    options: CONCERN_OPTIONS_FEMALE,
  },
  {
    id: "duration",
    section: 1,
    prompt: "How long have you been noticing this?",
    type: "single",
    options: [
      { value: "curious", label: "Just curious / first look" },
      { value: "weeks", label: "A few weeks" },
      { value: "months", label: "A few months" },
      { value: "years", label: "A year or more" },
    ],
  },
  {
    id: "makeup_frequency",
    section: 1,
    prompt: "How often do you wear base makeup?",
    type: "single",
    options: [
      { value: "daily", label: "Most days" },
      { value: "sometimes", label: "A few times a week" },
      { value: "rarely", label: "Rarely or never" },
    ],
  },
  {
    id: "routine",
    section: 1,
    prompt: "What does your current routine look like?",
    type: "single",
    options: [
      { value: "minimal", label: "Cleanser + moisturizer" },
      { value: "basic", label: "Cleanser, moisturizer, SPF" },
      { value: "active", label: "Includes acids or retinoids" },
      { value: "extensive", label: "Six or more steps" },
    ],
  },
  {
    id: "actives",
    section: 1,
    prompt: "Which actives are you using now?",
    help: "We’ll only map pathways — never brand names.",
    type: "multi",
    options: [
      { value: "retinoid", label: "Retinoid / retinol" },
      { value: "aha_bha", label: "AHA or BHA" },
      { value: "vitamin_c", label: "Vitamin C" },
      { value: "niacinamide", label: "Niacinamide" },
      { value: "none", label: "None of these" },
    ],
  },
  {
    id: "sun_habits",
    section: 1,
    prompt: "How do you handle daytime sun?",
    type: "single",
    options: [
      { value: "daily_spf", label: "Daily SPF, rain or shine" },
      { value: "sometimes", label: "SPF when I remember" },
      { value: "rarely", label: "Rarely" },
      { value: "outdoors", label: "Lots of outdoor time / tanning" },
    ],
  },
];

export const MALE_SKIN_QUESTIONS: QuestionDef[] = [
  {
    id: "primary_concerns",
    section: 1,
    prompt: "What do you notice most on the surface of your skin?",
    help: "Select everything that feels true. This is not a diagnosis.",
    type: "multi",
    options: CONCERN_OPTIONS_MALE,
  },
  {
    id: "duration",
    section: 1,
    prompt: "How long have you been noticing this?",
    type: "single",
    options: [
      { value: "curious", label: "Just curious / first look" },
      { value: "weeks", label: "A few weeks" },
      { value: "months", label: "A few months" },
      { value: "years", label: "A year or more" },
    ],
  },
  {
    id: "facial_hair",
    section: 1,
    prompt: "How much facial hair is typically in the scan area?",
    help: "Helps the analyzer read cheeks and jawline fairly.",
    type: "single",
    options: [
      { value: "none", label: "Clean-shaven" },
      { value: "stubble", label: "Stubble" },
      { value: "beard", label: "Full beard / covered jaw" },
    ],
  },
  {
    id: "routine",
    section: 1,
    prompt: "What does your current routine look like?",
    type: "single",
    options: [
      { value: "none", label: "Just water or a face wash" },
      { value: "minimal", label: "Cleanser + moisturizer" },
      { value: "basic", label: "Cleanser, moisturizer, SPF" },
      { value: "active", label: "Includes acids or retinoids" },
    ],
  },
  {
    id: "actives",
    section: 1,
    prompt: "Which actives are you using now?",
    type: "multi",
    options: [
      { value: "retinoid", label: "Retinoid / retinol" },
      { value: "aha_bha", label: "AHA or BHA" },
      { value: "vitamin_c", label: "Vitamin C" },
      { value: "none", label: "None of these" },
    ],
  },
  {
    id: "sun_habits",
    section: 1,
    prompt: "How do you handle daytime sun?",
    type: "single",
    options: [
      { value: "daily_spf", label: "Daily SPF" },
      { value: "sometimes", label: "SPF when I remember" },
      { value: "rarely", label: "Rarely" },
      { value: "outdoors", label: "Lots of outdoor time" },
    ],
  },
];

export const FEMALE_LIFESTYLE_QUESTIONS: QuestionDef[] = [
  {
    id: "sleep",
    section: 2,
    prompt: "How has your sleep been lately?",
    type: "single",
    options: [
      { value: "rested", label: "Mostly 7+ hours, I wake rested" },
      { value: "inconsistent", label: "Inconsistent" },
      { value: "poor", label: "Often under 6 hours" },
    ],
  },
  {
    id: "stress",
    section: 2,
    prompt: "How would you describe daily stress?",
    type: "single",
    options: [
      { value: "low", label: "Mostly manageable" },
      { value: "moderate", label: "Present, but I cope" },
      { value: "high", label: "High most days" },
    ],
  },
  {
    id: "water",
    section: 2,
    prompt: "How much water do you typically drink?",
    type: "single",
    options: [
      { value: "enough", label: "About 2 litres or more" },
      { value: "some", label: "A few glasses" },
      { value: "low", label: "Mostly tea, coffee, or soda" },
    ],
  },
  {
    id: "diet",
    section: 2,
    prompt: "How balanced do meals feel right now?",
    type: "single",
    options: [
      { value: "balanced", label: "Regular meals, plenty of plants" },
      { value: "mixed", label: "Mixed — some days better than others" },
      { value: "irregular", label: "Skipped meals or very processed" },
    ],
  },
  {
    id: "environment",
    section: 2,
    prompt: "What environment is your skin in most days?",
    type: "single",
    options: [
      { value: "humid", label: "Humid or tropical" },
      { value: "dry_ac", label: "Dry air or heavy AC / heating" },
      { value: "polluted", label: "Urban pollution" },
      { value: "mild", label: "Mild / mixed" },
    ],
  },
  {
    id: "sensitivity",
    section: 2,
    prompt: "Does your skin sting, flush, or flake with new products?",
    help: "Barrier and sensitivity are mostly sensory — we use your answer, not the photo.",
    type: "single",
    options: [
      { value: "no", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "yes", label: "Often — I have to be careful" },
    ],
  },
  {
    id: "life_stage",
    section: 2,
    prompt: "Which life stage feels most relevant right now?",
    type: "single",
    options: [
      { value: "regular", label: "Regular cycle" },
      { value: "pregnancy", label: "Pregnancy" },
      { value: "postpartum", label: "Postpartum" },
      { value: "peri", label: "Perimenopause" },
      { value: "meno", label: "Menopause" },
      { value: "none", label: "None of these / prefer not to say" },
    ],
  },
  {
    id: "cycle_skin",
    section: 2,
    prompt: "Do you notice breakouts or tone shifts around your cycle?",
    type: "single",
    options: [
      { value: "yes", label: "Yes, predictably" },
      { value: "sometimes", label: "Sometimes" },
      { value: "no", label: "Not that I’ve noticed" },
      { value: "na", label: "Not applicable" },
    ],
  },
  {
    id: "food_habits",
    section: 2,
    prompt: "How often do high-sugar or very rich meals show up?",
    type: "single",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "weekly", label: "A few times a week" },
      { value: "daily", label: "Most days" },
    ],
  },
  {
    id: "smoking",
    section: 2,
    prompt: "Do you smoke or vape?",
    type: "single",
    options: [
      { value: "no", label: "No" },
      { value: "occasionally", label: "Occasionally" },
      { value: "yes", label: "Regularly" },
    ],
  },
];

export const MALE_LIFESTYLE_QUESTIONS: QuestionDef[] = [
  {
    id: "sleep",
    section: 2,
    prompt: "How has your sleep been lately?",
    type: "single",
    options: [
      { value: "rested", label: "Mostly 7+ hours" },
      { value: "inconsistent", label: "Inconsistent" },
      { value: "poor", label: "Often under 6 hours" },
    ],
  },
  {
    id: "stress",
    section: 2,
    prompt: "How would you describe daily stress?",
    type: "single",
    options: [
      { value: "low", label: "Mostly manageable" },
      { value: "moderate", label: "Present, but I cope" },
      { value: "high", label: "High most days" },
    ],
  },
  {
    id: "water",
    section: 2,
    prompt: "How much water do you typically drink?",
    type: "single",
    options: [
      { value: "enough", label: "About 2 litres or more" },
      { value: "some", label: "A few glasses" },
      { value: "low", label: "Mostly tea, coffee, or soda" },
    ],
  },
  {
    id: "diet",
    section: 2,
    prompt: "How balanced do meals feel right now?",
    type: "single",
    options: [
      { value: "balanced", label: "Regular, reasonably balanced" },
      { value: "mixed", label: "Mixed" },
      { value: "irregular", label: "Irregular or very processed" },
    ],
  },
  {
    id: "environment",
    section: 2,
    prompt: "What environment is your skin in most days?",
    type: "single",
    options: [
      { value: "humid", label: "Humid or tropical" },
      { value: "dry_ac", label: "Dry air or heavy AC / heating" },
      { value: "polluted", label: "Urban pollution" },
      { value: "mild", label: "Mild / mixed" },
    ],
  },
  {
    id: "sensitivity",
    section: 2,
    prompt: "Does your skin sting, flush, or flake with new products?",
    help: "Barrier and sensitivity are mostly sensory — we use your answer, not the photo.",
    type: "single",
    options: [
      { value: "no", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "yes", label: "Often — I have to be careful" },
    ],
  },
  {
    id: "shave",
    section: 2,
    prompt: "How does shaving usually treat your skin?",
    type: "single",
    options: [
      { value: "easy", label: "Smooth, little irritation" },
      { value: "sometimes", label: "Occasional redness or bumps" },
      { value: "irritating", label: "Frequent redness or ingrowns" },
      { value: "no_shave", label: "I rarely shave" },
    ],
  },
  {
    id: "smoking",
    section: 2,
    prompt: "Do you smoke or vape?",
    type: "single",
    options: [
      { value: "no", label: "No" },
      { value: "occasionally", label: "Occasionally" },
      { value: "yes", label: "Regularly" },
    ],
  },
];

export function questionsFor(section: 1 | 2, gender: Gender): QuestionDef[] {
  if (section === 1) {
    return gender === "female" ? FEMALE_SKIN_QUESTIONS : MALE_SKIN_QUESTIONS;
  }
  return gender === "female" ? FEMALE_LIFESTYLE_QUESTIONS : MALE_LIFESTYLE_QUESTIONS;
}

export const CONCERN_TO_TRAIT: Record<string, import("./types").TraitKey> = {
  aging: "signs_of_aging",
  pigment: "uneven_skin_tone",
  congestion: "signs_of_congestion",
  texture: "textural_irregularities",
  redness: "look_of_redness",
  shine: "visible_shine",
  eyes: "eye_care",
  dullness: "dullness",
  dryness: "dryness_dehydration",
};

export const PATHWAY_COPY: Record<
  TreatmentPathway,
  { title: string; defaultReason: string }
> = {
  Retinoid_Pathway: {
    title: "Retinoid pathway",
    defaultReason: "Supports the look of lines and surface renewal.",
  },
  Peptide_Support: {
    title: "Peptide support",
    defaultReason: "A gentler option when the look of firmness is the goal.",
  },
  Pigment_Inhibitor: {
    title: "Pigment inhibitor",
    defaultReason: "Helps the look of uneven melanin clusters over time.",
  },
  BHA_Exfoliant: {
    title: "BHA exfoliant",
    defaultReason: "Targets the look of congestion and enlarged pores.",
  },
  AHA_Exfoliant: {
    title: "AHA exfoliant",
    defaultReason: "Smooths the look of uneven surface texture.",
  },
  Pore_Refiner: {
    title: "Pore refiner",
    defaultReason: "Supports a more even-looking pore appearance.",
  },
  Soothing_Calm: {
    title: "Soothing / calm",
    defaultReason: "For the look of redness and a less reactive surface.",
  },
  Oil_Control: {
    title: "Oil control",
    defaultReason: "Addresses visible shine and excess sebum look.",
  },
  Brightening_Eye: {
    title: "Brightening eye",
    defaultReason: "For the look of orbital shadows.",
  },
  Depuffing_Eye: {
    title: "Depuffing eye",
    defaultReason: "For the look of under-eye volume.",
  },
  Radiance_Boost: {
    title: "Radiance boost",
    defaultReason: "Supports light return when skin looks matte or ashy.",
  },
  Hydration_Occlusive: {
    title: "Hydration / occlusive",
    defaultReason: "For visible flaking or a tight, dehydrated look.",
  },
  Barrier_Repair: {
    title: "Barrier repair",
    defaultReason: "When skin feels reactive or shows extreme surface stress.",
  },
  Antioxidant_Defense: {
    title: "Antioxidant defense",
    defaultReason: "A universal preventative — no visual marker required.",
  },
  Daily_SPF: {
    title: "Daily SPF",
    defaultReason: "The one pathway every scan still maps back to.",
  },
};
