import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_ABOUT_ME } from "@milc/shared";

const dir = mkdtempSync(join(tmpdir(), "skin-store-"));
process.env.QUIZ_STORE_PATH = join(dir, "sessions.json");

const { loadSession, saveSession } = await import("./store");

afterEach(() => {
  process.env.QUIZ_STORE_PATH = join(dir, "sessions.json");
});

describe("quiz store", () => {
  it("round-trips a session through disk so resume survives process reloads", () => {
    const saved = saveSession({
      sessionId: "disk-1",
      aboutMe: { ...EMPTY_ABOUT_ME, fullName: "Alex Chen", gender: "male" },
      answers: [],
      faceImages: { front: null, threeQuarter: null },
      aiAnalysis: null,
      result: null,
      currentSection: 1,
      currentStep: 0,
      privacyAccepted: false,
      photoConsent: false,
    });
    expect(saved.aboutMe.fullName).toBe("Alex Chen");
    expect(loadSession("disk-1")?.aboutMe.gender).toBe("male");
    expect(loadSession("missing")).toBeNull();
  });
});
