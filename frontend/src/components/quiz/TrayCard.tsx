export function TrayCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-[28px] border border-white/70 bg-card p-5 shadow-tray md:p-8">
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-full bg-ink px-5 py-3.5 text-sm font-medium text-ivory transition hover:bg-terracotta disabled:cursor-not-allowed disabled:bg-sand"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full px-5 py-2.5 text-sm text-muted hover:text-ink"
    >
      {children}
    </button>
  );
}
