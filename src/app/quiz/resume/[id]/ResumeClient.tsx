"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuiz } from "@/context/QuizContext";
import type { QuizState } from "@/lib/types";

export function ResumeClient({ id }: { id: string }) {
  const { hydrate } = useQuiz();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/quiz/resume/${id}`);
        const data = (await res.json()) as QuizState & { error?: string };
        if (!res.ok) throw new Error(data.error || "Session not found.");
        if (cancelled) return;
        hydrate(data);
        router.replace("/quiz");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not resume.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, hydrate, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 text-center">
      {error ? (
        <>
          <h1 className="font-serif text-3xl text-ink">We couldn’t find that session</h1>
          <p className="mt-3 text-sm text-muted">{error} Server memory resets when the process restarts.</p>
          <Link href="/quiz" className="mt-6 rounded-full bg-ink px-5 py-3 text-sm text-ivory">
            Start a new assessment
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted">Loading your saved assessment…</p>
      )}
    </main>
  );
}
