import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateResult } from "@milc/shared";
import type {
  AboutMe,
  FaceImages,
  QuizAnswer,
  QuizResult,
  QuizState,
  SkinAIAnalysis,
} from "@milc/shared";
import { EMPTY_ABOUT_ME } from "@milc/shared";

const STORAGE_KEY = "facial-skin-quiz-state";

function newSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createInitialState(): QuizState {
  return {
    sessionId: newSessionId(),
    aboutMe: { ...EMPTY_ABOUT_ME },
    answers: [],
    faceImages: { front: null, threeQuarter: null },
    aiAnalysis: null,
    result: null,
    currentSection: 0,
    currentStep: 0,
    privacyAccepted: false,
    photoConsent: false,
  };
}

function loadStored(): QuizState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuizState;
    if (!parsed?.sessionId || !parsed.aboutMe) return null;
    return parsed;
  } catch {
    return null;
  }
}

interface QuizContextValue {
  state: QuizState;
  hydrated: boolean;
  setAboutMe: (patch: Partial<AboutMe>) => void;
  setAnswer: (answer: QuizAnswer) => void;
  goToSection: (section: number, step?: number) => void;
  setCurrentStep: (step: number) => void;
  setPrivacyAccepted: (value: boolean) => void;
  setPhotoConsent: (value: boolean) => void;
  setFaceImages: (images: Partial<FaceImages>) => void;
  setAIAnalysis: (analysis: SkinAIAnalysis | null) => void;
  generateQuizResult: (analysis?: SkinAIAnalysis) => QuizResult;
  hydrate: (next: QuizState) => void;
  reset: () => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QuizState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored) setState(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const setAboutMe = useCallback((patch: Partial<AboutMe>) => {
    setState((prev) => ({ ...prev, aboutMe: { ...prev.aboutMe, ...patch } }));
  }, []);

  const setAnswer = useCallback((answer: QuizAnswer) => {
    setState((prev) => {
      const rest = prev.answers.filter((a) => a.question_id !== answer.question_id);
      return { ...prev, answers: [...rest, answer] };
    });
  }, []);

  const goToSection = useCallback((section: number, step = 0) => {
    setState((prev) => ({ ...prev, currentSection: section, currentStep: step }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const setPrivacyAccepted = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, privacyAccepted: value }));
  }, []);

  const setPhotoConsent = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, photoConsent: value }));
  }, []);

  const setFaceImages = useCallback((images: Partial<FaceImages>) => {
    setState((prev) => ({ ...prev, faceImages: { ...prev.faceImages, ...images } }));
  }, []);

  const setAIAnalysis = useCallback((analysis: SkinAIAnalysis | null) => {
    setState((prev) => ({ ...prev, aiAnalysis: analysis }));
  }, []);

  const generateQuizResult = useCallback((analysis?: SkinAIAnalysis) => {
    let result!: QuizResult;
    setState((prev) => {
      result = generateResult(prev, analysis);
      return {
        ...prev,
        aiAnalysis: analysis ?? prev.aiAnalysis,
        result,
      };
    });
    return result;
  }, []);

  const hydrate = useCallback((next: QuizState) => {
    setState(next);
    setHydrated(true);
  }, []);

  const reset = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      setAboutMe,
      setAnswer,
      goToSection,
      setCurrentStep,
      setPrivacyAccepted,
      setPhotoConsent,
      setFaceImages,
      setAIAnalysis,
      generateQuizResult,
      hydrate,
      reset,
    }),
    [
      state,
      hydrated,
      setAboutMe,
      setAnswer,
      goToSection,
      setCurrentStep,
      setPrivacyAccepted,
      setPhotoConsent,
      setFaceImages,
      setAIAnalysis,
      generateQuizResult,
      hydrate,
      reset,
    ],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used inside QuizProvider");
  return ctx;
}
