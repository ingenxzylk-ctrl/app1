export type AnalyticsEvent =
  | "quiz_started"
  | "about_me_completed"
  | "gender_selected"
  | "section_completed"
  | "privacy_accepted"
  | "photo_consent"
  | "photo_captured"
  | "analysis_started"
  | "analysis_completed"
  | "results_viewed"
  | "progress_saved";

export function track(event: AnalyticsEvent, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const detail = { event, at: new Date().toISOString(), ...payload };
  window.dispatchEvent(new CustomEvent("skin-quiz-analytics", { detail }));
  if (process.env.NODE_ENV === "development") {
    console.info("[skin-quiz]", detail);
  }
}
