import { useState } from "react";
import { useQuiz } from "@/context/QuizContext";
import { track } from "@/lib/analytics";
import type { SkinAIAnalysis } from "@milc/shared";
import { PhotoCapture } from "./PhotoCapture";
import { ProgressHeader } from "./ProgressHeader";
import { GhostButton, PrimaryButton, TrayCard } from "./TrayCard";

type ScanStep = "consent" | "guide" | "front" | "three_quarter" | "analyzing";

export function Section3FaceScan({
  onComplete,
}: {
  onComplete: (analysis: SkinAIAnalysis) => void;
}) {
  const { state, setPhotoConsent, setFaceImages, setAIAnalysis } = useQuiz();
  const [step, setStep] = useState<ScanStep>(state.photoConsent ? "guide" : "consent");
  const [consent, setConsent] = useState(state.photoConsent);
  const [front, setFront] = useState<string | null>(state.faceImages.front);
  const [threeQuarter, setThreeQuarter] = useState<string | null>(state.faceImages.threeQuarter);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Preparing your photos…");

  const stepIndex = { consent: 0, guide: 1, front: 2, three_quarter: 3, analyzing: 4 }[step];

  async function moderate(image: string, label: string) {
    const res = await fetch("/api/skin/moderate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, sessionId: state.sessionId }),
    });
    const data = (await res.json()) as {
      safe?: boolean;
      faceVisible?: boolean;
      issues?: string[];
      error?: string;
    };
    if (!res.ok) throw new Error(data.error || `Could not check the ${label} photo.`);
    if (!data.safe || !data.faceVisible) {
      throw new Error(
        data.issues?.join(" ") ||
          `We need a clear, well-lit face in the ${label} photo. Please retake it.`,
      );
    }
  }

  async function runAnalysis() {
    if (!front || !threeQuarter) {
      setError("Both photos are needed before we can analyze.");
      return;
    }
    setError("");
    setStep("analyzing");
    track("analysis_started");
    try {
      setStatus("Checking the front photo…");
      await moderate(front, "front");
      setStatus("Checking the three-quarter photo…");
      await moderate(threeQuarter, "three-quarter");
      setStatus("Reading surface light, shadow, and texture…");
      const res = await fetch("/api/skin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          front,
          threeQuarter,
          gender: state.aboutMe.gender,
          ageRange: state.aboutMe.ageRange,
          skinType: state.aboutMe.skinType,
          sessionId: state.sessionId,
          answers: state.answers,
        }),
      });
      const data = (await res.json()) as SkinAIAnalysis & { error?: string };
      if (!res.ok) throw new Error(data.error || "Analysis failed.");
      setFaceImages({ front, threeQuarter });
      setAIAnalysis(data);
      track("analysis_completed", { source: data.source, confidence: data.overall_confidence });
      onComplete(data);
    } catch (err) {
      setStep("three_quarter");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <TrayCard>
      <ProgressHeader section={3} step={stepIndex} stepCount={5} />

      {step === "consent" && (
        <>
          <p className="mb-3 text-sm leading-relaxed text-muted">
            We use your photos only to read visible surface traits — light, shadow, color
            contrast, and texture. We do not diagnose medical conditions, and we never
            recommend brand names.
          </p>
          <label className="mb-5 flex items-start gap-3 rounded-2xl border border-sand bg-white/70 px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 accent-clay"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I consent to using these photos for a cosmetic facial analysis in this session.
            </span>
          </label>
          <PrimaryButton
            disabled={!consent}
            onClick={() => {
              setPhotoConsent(true);
              track("photo_consent");
              setStep("guide");
            }}
          >
            I agree — show me how to shoot
          </PrimaryButton>
        </>
      )}

      {step === "guide" && (
        <>
          <p className="mb-4 text-sm text-muted">
            Two photos: one straight-on, one at 45°. Bare face, even daylight, no filters.
          </p>
          <div className="mb-5 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-moss/30 bg-moss/5 p-3">
              <p className="mb-2 font-medium text-moss">Helpful</p>
              <ul className="space-y-1.5 text-muted">
                <li>Window light on your face</li>
                <li>Hair off the forehead</li>
                <li>Neutral expression, eyes open</li>
                <li>Camera at eye level</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-terracotta/30 bg-terracotta/5 p-3">
              <p className="mb-2 font-medium text-terracotta">Skip these</p>
              <ul className="space-y-1.5 text-muted">
                <li>Bathroom vanity glare</li>
                <li>Sunglasses or heavy makeup</li>
                <li>Beauty filters / smoothing</li>
                <li>Cropped chin or forehead</li>
              </ul>
            </div>
          </div>
          <PrimaryButton onClick={() => setStep("front")}>I’m ready</PrimaryButton>
        </>
      )}

      {step === "front" && (
        <>
          <PhotoCapture
            label="Front photo"
            hint="Look straight at the camera. Chin slightly down so we can see the forehead and under-eyes."
            value={front}
            onChange={setFront}
          />
          {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}
          <div className="mt-6 flex gap-2">
            <GhostButton onClick={() => setStep("guide")}>Back</GhostButton>
            <PrimaryButton
              disabled={!front}
              onClick={() => {
                setError("");
                setStep("three_quarter");
              }}
            >
              Next photo
            </PrimaryButton>
          </div>
        </>
      )}

      {step === "three_quarter" && (
        <>
          <PhotoCapture
            label="Three-quarter photo"
            hint="Turn about 45° so we can see cheek texture and the jawline. Same lighting as the front shot."
            value={threeQuarter}
            onChange={setThreeQuarter}
          />
          {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}
          <div className="mt-6 flex gap-2">
            <GhostButton onClick={() => setStep("front")}>Back</GhostButton>
            <PrimaryButton disabled={!threeQuarter} onClick={runAnalysis}>
              Analyze my skin
            </PrimaryButton>
          </div>
        </>
      )}

      {step === "analyzing" && (
        <div className="py-10 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-sand border-t-clay" />
          <p className="font-serif text-xl text-ink">Reading the surface</p>
          <p className="mt-2 text-sm text-muted">{status}</p>
        </div>
      )}
    </TrayCard>
  );
}
