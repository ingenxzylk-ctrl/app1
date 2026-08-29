import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { QuizState } from "./types";

const FILE = process.env.QUIZ_STORE_PATH || "/tmp/facial-skin-quiz-sessions.json";

function loadAll(): Map<string, QuizState> {
  try {
    if (!existsSync(FILE)) return new Map();
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, QuizState>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function persist(sessions: Map<string, QuizState>): void {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(Object.fromEntries(sessions)), "utf8");
}

export function saveSession(state: QuizState): QuizState {
  const sessions = loadAll();
  const copy = structuredClone(state);
  sessions.set(state.sessionId, copy);
  persist(sessions);
  return copy;
}

export function loadSession(id: string): QuizState | null {
  const found = loadAll().get(id);
  return found ? structuredClone(found) : null;
}

export function listSessionIds(): string[] {
  return [...loadAll().keys()];
}
