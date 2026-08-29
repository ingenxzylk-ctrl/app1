import { QuestionFlow } from "./QuestionFlow";

export function Section2LifestyleFemale({ onComplete }: { onComplete: () => void }) {
  return <QuestionFlow section={2} onComplete={onComplete} />;
}
