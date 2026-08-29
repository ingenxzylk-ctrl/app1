import type { QuizState } from "./types";

const sessions = new Map<string, QuizState>();

export function saveSession(state: QuizState): QuizState {
  sessions.set(state.sessionId, structuredClone(state));
  return sessions.get(state.sessionId)!;
}

export function loadSession(id: string): QuizState | null {
  const found = sessions.get(id);
  return found ? structuredClone(found) : null;
}

export function listSessionIds(): string[] {
  return [...sessions.keys()];
}
