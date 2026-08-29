"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useQuiz } from "@/context/QuizContext";
import { track } from "@/lib/analytics";
import type { SkinAIAnalysis } from "@/lib/types";
import { Section0AboutMe } from "@/components/quiz/Section0AboutMe";
import { Section1SkinProfileFemale } from "@/components/quiz/Section1SkinProfileFemale";
import { Section1SkinProfileMale } from "@/components/quiz/Section1SkinProfileMale";
import { Section2LifestyleFemale } from "@/components/quiz/Section2LifestyleFemale";
import { Section2LifestyleMale } from "@/components/quiz/Section2LifestyleMale";
import { Section3FaceScan } from "@/components/quiz/Section3FaceScan";
import { ResultsPage } from "@/components/quiz/ResultsPage";

export default function QuizPage() {
  const { state, hydrated, generateQuizResult, goToSection } = useQuiz();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    track("quiz_started", { sessionId: state.sessionId });
    // session id is stable per mount of stored state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.result) setShowResults(true);
  }, [state.result]);

  const handleFinish = useCallback(
    (analysis?: SkinAIAnalysis) => {
      generateQuizResult(analysis);
      setShowResults(true);
      track("results_viewed");
    },
    [generateQuizResult],
  );

  const gender = state.aboutMe.gender;

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Restoring your session…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-[11px] uppercase tracking-[0.2em] text-clay">
          Facial skin analysis
        </Link>
        {showResults && (
          <button
            type="button"
            onClick={() => {
              setShowResults(false);
              goToSection(3, 0);
            }}
            className="text-xs text-muted hover:text-ink"
          >
            Back to scan
          </button>
        )}
      </div>

      {showResults ? (
        <ResultsPage />
      ) : (
        <>
          {state.currentSection === 0 && <Section0AboutMe />}
          {state.currentSection === 1 &&
            (gender === "male" ? <Section1SkinProfileMale /> : <Section1SkinProfileFemale />)}
          {state.currentSection === 2 &&
            (gender === "male" ? (
              <Section2LifestyleMale onComplete={() => goToSection(3, 0)} />
            ) : (
              <Section2LifestyleFemale onComplete={() => goToSection(3, 0)} />
            ))}
          {state.currentSection === 3 && <Section3FaceScan onComplete={handleFinish} />}
        </>
      )}
    </main>
  );
}
