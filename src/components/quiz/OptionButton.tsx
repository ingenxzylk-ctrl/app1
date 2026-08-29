"use client";

export function OptionButton({
  selected,
  label,
  hint,
  onClick,
}: {
  selected: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-clay bg-clay/10 shadow-soft"
          : "border-sand/80 bg-white/60 hover:border-clay/40 hover:bg-white"
      }`}
    >
      <span className="block text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
    </button>
  );
}
