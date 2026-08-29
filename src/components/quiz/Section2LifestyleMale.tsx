"use client";

import { QuestionFlow } from "./QuestionFlow";

export function Section2LifestyleMale({ onComplete }: { onComplete: () => void }) {
  return <QuestionFlow section={2} onComplete={onComplete} />;
}
