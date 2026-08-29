"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuiz } from "@/context/QuizContext";
import { track } from "@/lib/analytics";
import { TRAIT_LABELS } from "@/lib/types";

const FACTOR_COLORS: Record<string, string> = {
  uv: "bg-amber/15 text-amber",
  stress: "bg-clay/15 text-terracotta",
  sleep: "bg-sand text-ink",
  hormones: "bg-clay/20 text-terracotta",
  dehydration: "bg-moss/15 text-moss",
  environment: "bg-sand text-ink",
  shaving: "bg-clay/15 text-terracotta",
  sensitivity: "bg-terracotta/15 text-terracotta",
  diet: "bg-moss/10 text-moss",
  congestion: "bg-ink/10 text-ink",
  pigment: "bg-amber/15 text-amber",
  aging: "bg-sand text-ink",
};

function severityTone(severity: string): string {
  if (severity === "pronounced") return "bg-terracotta/15 text-terracotta";
  if (severity === "moderate") return "bg-clay/15 text-clay";
  if (severity === "mild") return "bg-moss/15 text-moss";
  return "bg-sand text-muted";
}

export function ResultsPage() {
  const { state, reset } = useQuiz();
  const result = state.result;
  const [resumeUrl, setResumeUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="mx-auto max-w-xl rounded-[28px] bg-card p-8 text-center shadow-tray">
        <p className="text-muted">No result yet.</p>
        <Link href="/quiz" className="mt-4 inline-block text-sm text-clay">
          Return to the quiz
        </Link>
      </div>
    );
  }

  async function saveProgress() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/quiz/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const data = (await res.json()) as { resumeUrl?: string; error?: string };
      if (!res.ok || !data.resumeUrl) throw new Error(data.error || "Could not save.");
      const absolute = `${window.location.origin}${data.resumeUrl}`;
      setResumeUrl(absolute);
      track("progress_saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const visibleTraits = result.traits.filter(
    (t) => t.status === true || t.status === "recommended" || t.status === "requires_user_input",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-[28px] border border-white/70 bg-card p-6 shadow-tray md:p-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-clay">
          Your skin snapshot
        </p>
        <h1 className="mt-2 font-serif text-3xl text-ink md:text-4xl">{result.headline}</h1>
        <p className="mt-2 text-sm text-muted">{result.skinLabel}</p>
        {state.aboutMe.fullName && (
          <p className="mt-1 text-sm text-muted">Prepared for {state.aboutMe.fullName}</p>
        )}

        {state.aiAnalysis && (
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-muted">
              <span>Scan confidence</span>
              <span>{result.overallConfidence}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sand">
              <div
                className="h-full rounded-full bg-clay"
                style={{ width: `${Math.min(100, result.overallConfidence)}%` }}
              />
            </div>
            {state.aiAnalysis.source === "fallback" && (
              <p className="mt-2 text-xs text-muted">
                Offline fallback — the model key was not set, so we mapped your answers instead of pixels.
              </p>
            )}
          </div>
        )}

        {(result.lowConfidence || result.mismatchNotes.length > 0) && (
          <ul className="mt-4 space-y-2 rounded-2xl border border-amber/30 bg-amber/10 p-4 text-sm text-ink">
            {result.mismatchNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[28px] bg-card p-6 shadow-tray">
        <h2 className="font-serif text-2xl text-ink">Surface traits</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Cosmetic language only. No medical labels.
        </p>
        <div className="space-y-3">
          {visibleTraits.map((trait) => (
            <div key={trait.trait} className="rounded-2xl border border-sand/80 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink">{TRAIT_LABELS[trait.trait]}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${severityTone(String(trait.severity))}`}>
                  {trait.status === "recommended"
                    ? "recommended"
                    : trait.status === "requires_user_input"
                      ? "from your input"
                      : trait.severity}
                </span>
              </div>
              {trait.note && <p className="mt-1 text-xs text-muted">{trait.note}</p>}
            </div>
          ))}
        </div>
      </div>

      {result.factors.length > 0 && (
        <div className="rounded-[28px] bg-card p-6 shadow-tray">
          <h2 className="font-serif text-2xl text-ink">Contributing factors</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Up to three, ranked from your answers.</p>
          <div className="flex flex-wrap gap-2">
            {result.factors.map((f) => (
              <span
                key={f.tag}
                className={`rounded-full px-3 py-1 text-xs font-medium ${FACTOR_COLORS[f.tag] ?? "bg-sand"}`}
              >
                {f.label}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {result.factors.map((f) => (
              <li key={`${f.tag}-d`} className="text-sm text-muted">
                <span className="font-medium text-ink">{f.label}. </span>
                {f.detail}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[28px] bg-card p-6 shadow-tray">
        <h2 className="font-serif text-2xl text-ink">Outlook</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{result.outlook}</p>
      </div>

      <div className="rounded-[28px] bg-card p-6 shadow-tray">
        <h2 className="font-serif text-2xl text-ink">Treatment pathways</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Active categories only — your backend can map these to native products. No brand names.
        </p>
        <ol className="space-y-3">
          {result.recommendations.map((rec, i) => (
            <li key={rec.pathway} className="rounded-2xl border border-sand/80 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-clay">
                {String(i + 1).padStart(2, "0")} · {rec.pathway}
              </p>
              <p className="mt-1 font-medium text-ink">{rec.title}</p>
              <p className="mt-1 text-sm text-muted">{rec.reason}</p>
            </li>
          ))}
        </ol>
      </div>

      {state.aiAnalysis?.summary && (
        <p className="px-2 text-xs leading-relaxed text-muted">{state.aiAnalysis.summary}</p>
      )}

      <div className="rounded-[28px] bg-card p-6 shadow-tray">
        <h2 className="font-serif text-xl text-ink">Save this session</h2>
        <p className="mt-1 text-sm text-muted">
          Optional. Stores this attempt on the server and gives you a resume link.
        </p>
        <button
          type="button"
          onClick={saveProgress}
          disabled={saving}
          className="mt-4 w-full rounded-full bg-ink py-3 text-sm text-ivory disabled:bg-sand"
        >
          {saving ? "Saving…" : "Save progress"}
        </button>
        {resumeUrl && (
          <div className="mt-3 space-y-2">
            <p className="break-all text-xs text-moss">Resume anytime: {resumeUrl}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(resumeUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setSaveError("Could not copy — select the link above.");
                }
              }}
              className="text-xs text-clay underline"
            >
              {copied ? "Copied" : "Copy resume link"}
            </button>
          </div>
        )}
        {saveError && <p className="mt-2 text-sm text-terracotta">{saveError}</p>}
        <button
          type="button"
          onClick={reset}
          className="mt-3 w-full text-center text-sm text-muted"
        >
          Start a new assessment
        </button>
      </div>

      <p className="px-2 pb-8 text-center text-[11px] leading-relaxed text-muted">
        This is a cosmetic surface analysis, not a medical diagnosis. If you have sudden
        swelling, open wounds, or a changing lesion, see a clinician.
      </p>
    </div>
  );
}
