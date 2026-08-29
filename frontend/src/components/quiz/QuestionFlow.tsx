import { useEffect, useMemo, useState } from "react";
import { useQuiz } from "@/context/QuizContext";
import { questionsFor, type QuestionDef } from "@milc/shared";
import { track } from "@/lib/analytics";
import type { Gender } from "@milc/shared";
import { OptionButton } from "./OptionButton";
import { ProgressHeader } from "./ProgressHeader";
import { GhostButton, PrimaryButton, TrayCard } from "./TrayCard";

function PrivacyGate({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <div>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        The next questions are about sleep, stress, hormones, and daily environment.
        They stay on this device unless you choose to save a resume link. Nothing here
        is a medical history — we use it only to rank cosmetic contributing factors.
      </p>
      <label className="mb-5 flex items-start gap-3 rounded-2xl border border-sand bg-white/70 px-4 py-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 accent-clay"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>I understand this is for a cosmetic assessment, not a clinical diagnosis.</span>
      </label>
      <PrimaryButton disabled={!checked} onClick={onAccept}>
        Continue
      </PrimaryButton>
    </div>
  );
}

export function QuestionFlow({
  section,
  onComplete,
}: {
  section: 1 | 2;
  onComplete: () => void;
}) {
  const { state, setAnswer, setCurrentStep, setPrivacyAccepted } = useQuiz();
  const gender = (state.aboutMe.gender || "female") as Gender;
  const questions = useMemo(() => questionsFor(section, gender), [section, gender]);
  const [step, setStep] = useState(state.currentSection === section ? state.currentStep : 0);
  const [error, setError] = useState("");

  const showPrivacy = section === 2 && !state.privacyAccepted;
  const question: QuestionDef | undefined = questions[step];
  const existing = state.answers.find((a) => a.question_id === question?.id)?.value;
  const selected = existing ? (Array.isArray(existing) ? existing : [existing]) : [];

  useEffect(() => {
    setCurrentStep(step);
  }, [step, setCurrentStep]);

  function toggle(value: string) {
    if (!question) return;
    if (question.type === "single") {
      setAnswer({
        section,
        question_id: question.id,
        gender_path: gender,
        value,
      });
      return;
    }
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected.filter((v) => !(value === "none" || value === "baseline" || v === "none" || v === "baseline")), value];
    if (value === "none" || value === "baseline") {
      setAnswer({ section, question_id: question.id, gender_path: gender, value: [value] });
      return;
    }
    setAnswer({ section, question_id: question.id, gender_path: gender, value: next });
  }

  function next() {
    setError("");
    if (!question) return;
    if (selected.length === 0) {
      setError("Choose at least one option to continue.");
      return;
    }
    if (step >= questions.length - 1) {
      track("section_completed", { section, gender });
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <TrayCard>
      <ProgressHeader
        section={section}
        step={showPrivacy ? 0 : step}
        stepCount={showPrivacy ? questions.length + 1 : questions.length}
      />

      {showPrivacy ? (
        <PrivacyGate
          onAccept={() => {
            setPrivacyAccepted(true);
            track("privacy_accepted");
          }}
        />
      ) : question ? (
        <>
          <p className="mb-1 text-lg text-ink">{question.prompt}</p>
          {question.help && <p className="mb-4 text-sm text-muted">{question.help}</p>}
          <div className="space-y-2">
            {question.options.map((opt) => (
              <OptionButton
                key={opt.value}
                selected={selected.includes(opt.value)}
                label={opt.label}
                hint={opt.hint}
                onClick={() => toggle(opt.value)}
              />
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}
          <div className="mt-6 flex gap-2">
            {step > 0 && (
              <GhostButton onClick={() => setStep((s) => s - 1)}>Back</GhostButton>
            )}
            <PrimaryButton onClick={next}>
              {step === questions.length - 1
                ? section === 1
                  ? "Continue to lifestyle"
                  : "Continue to face scan"
                : "Continue"}
            </PrimaryButton>
          </div>
        </>
      ) : null}
    </TrayCard>
  );
}
