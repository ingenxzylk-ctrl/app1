"use client";

const SECTION_TITLES = ["About you", "Skin profile", "Lifestyle", "Face scan"];

export function ProgressHeader({
  section,
  step,
  stepCount,
}: {
  section: number;
  step: number;
  stepCount: number;
}) {
  return (
    <header className="mb-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-clay">
          Facial skin analysis
        </p>
        <p className="text-xs text-muted">
          Section {section + 1} of 4
        </p>
      </div>
      <div className="mb-3 flex gap-1.5">
        {SECTION_TITLES.map((title, i) => (
          <span
            key={title}
            className="dot"
            data-active={i === section}
            data-done={i < section}
            title={title}
          />
        ))}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {SECTION_TITLES[section]}
          </p>
          <h2 className="font-serif text-2xl text-ink md:text-[1.7rem]">
            {section === 0 && "Tell us about you"}
            {section === 1 && "What the surface is doing"}
            {section === 2 && "What life is doing to it"}
            {section === 3 && "A clear look at your skin"}
          </h2>
        </div>
        {stepCount > 1 && (
          <p className="shrink-0 text-xs text-muted">
            {step + 1} / {stepCount}
          </p>
        )}
      </div>
    </header>
  );
}
