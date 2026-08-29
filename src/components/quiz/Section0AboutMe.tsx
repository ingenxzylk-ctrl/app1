"use client";

import { useState } from "react";
import { useQuiz } from "@/context/QuizContext";
import { AGE_OPTIONS, COUNTRY_CODES, SKIN_TYPE_OPTIONS } from "@/lib/questions";
import { track } from "@/lib/analytics";
import type { AgeRange, Gender, SkinType } from "@/lib/types";
import { OptionButton } from "./OptionButton";
import { ProgressHeader } from "./ProgressHeader";
import { PrimaryButton, TrayCard } from "./TrayCard";

const STEPS = 4;

export function Section0AboutMe() {
  const { state, setAboutMe, goToSection } = useQuiz();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const me = state.aboutMe;

  function next() {
    setError("");
    if (step === 0) {
      if (me.fullName.trim().length < 2) {
        setError("Please enter your full name.");
        return;
      }
    }
    if (step === 1) {
      if (!/^\d{6,15}$/.test(me.whatsapp.replace(/\s/g, ""))) {
        setError("Enter a valid WhatsApp number.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(me.email)) {
        setError("Enter a valid email address.");
        return;
      }
    }
    if (step === 2 && !me.ageRange) {
      setError("Choose an age range.");
      return;
    }
    if (step === 3) {
      if (!me.gender) {
        setError("Choose a gender path — it routes the rest of the quiz.");
        return;
      }
      if (!me.skinType) {
        setError("How would you describe your skin type?");
        return;
      }
      track("about_me_completed", { gender: me.gender, skinType: me.skinType });
      track("gender_selected", { gender: me.gender });
      goToSection(1, 0);
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <TrayCard>
      <ProgressHeader section={0} step={step} stepCount={STEPS} />

      {step === 0 && (
        <label className="block">
          <span className="mb-2 block text-sm text-muted">Full name</span>
          <input
            value={me.fullName}
            onChange={(e) => setAboutMe({ fullName: e.target.value })}
            placeholder="e.g. Maya Shah"
            className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-ink outline-none focus:border-clay"
            autoComplete="name"
          />
        </label>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-muted">WhatsApp</span>
            <div className="flex gap-2">
              <select
                value={me.whatsappCountry}
                onChange={(e) => setAboutMe({ whatsappCountry: e.target.value })}
                className="rounded-2xl border border-sand bg-white px-3 py-3 text-sm outline-none focus:border-clay"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                value={me.whatsapp}
                onChange={(e) => setAboutMe({ whatsapp: e.target.value })}
                placeholder="98xxx xxxxx"
                inputMode="tel"
                className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-ink outline-none focus:border-clay"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Email</span>
            <input
              value={me.email}
              onChange={(e) => setAboutMe({ email: e.target.value })}
              placeholder="you@email.com"
              type="email"
              className="w-full rounded-2xl border border-sand bg-white px-4 py-3 text-ink outline-none focus:border-clay"
            />
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-2">
          {AGE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.value}
              selected={me.ageRange === opt.value}
              label={opt.label}
              onClick={() => setAboutMe({ ageRange: opt.value as AgeRange })}
            />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm text-muted">Gender — this branches later questions</p>
            <div className="grid grid-cols-2 gap-2">
              <OptionButton
                selected={me.gender === "female"}
                label="Female"
                onClick={() => setAboutMe({ gender: "female" as Gender })}
              />
              <OptionButton
                selected={me.gender === "male"}
                label="Male"
                onClick={() => setAboutMe({ gender: "male" as Gender })}
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm text-muted">How would you describe your skin?</p>
            <div className="space-y-2">
              {SKIN_TYPE_OPTIONS.map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={me.skinType === opt.value}
                  label={opt.label}
                  hint={opt.hint}
                  onClick={() => setAboutMe({ skinType: opt.value as SkinType })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-terracotta">{error}</p>}

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep((s) => s - 1);
            }}
            className="rounded-full px-4 py-3 text-sm text-muted hover:text-ink"
          >
            Back
          </button>
        )}
        <PrimaryButton onClick={next}>{step === 3 ? "Continue to skin profile" : "Continue"}</PrimaryButton>
      </div>
    </TrayCard>
  );
}
