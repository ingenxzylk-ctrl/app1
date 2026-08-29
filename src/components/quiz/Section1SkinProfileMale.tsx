"use client";

import { useQuiz } from "@/context/QuizContext";
import { QuestionFlow } from "./QuestionFlow";

export function Section1SkinProfileMale() {
  const { goToSection } = useQuiz();
  return <QuestionFlow section={1} onComplete={() => goToSection(2, 0)} />;
}
