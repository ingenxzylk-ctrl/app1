import { Link } from "react-router-dom";

const STEPS = [
  { n: "01", t: "About you", d: "Name, age, gender path, and how you’d describe your skin." },
  { n: "02", t: "Skin profile", d: "Visible concerns, routine, actives, and sun habits — branched by gender." },
  { n: "03", t: "Lifestyle", d: "Sleep, stress, environment, and (where relevant) hormones or shaving." },
  { n: "04", t: "Face scan", d: "Front + 45° photos. Gemini reads light, shadow, and texture — never brands." },
];

export function LandingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 py-12 md:py-20">
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-clay">
        MILC · Cosmetic facial analysis
      </p>
      <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-ink md:text-6xl">
        Understand the surface of your skin. Precisely, and without alarm.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
        A four-section assessment that reconciles what you notice with what a photo can
        actually show. Findings map to treatment pathways — BHA_Exfoliant, Pigment_Inhibitor,
        Barrier_Repair — so a catalog can attach the right native product. Never a diagnosis.
        Never a brand name.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          to="/quiz"
          className="rounded-full bg-ink px-6 py-3.5 text-sm font-medium text-ivory hover:bg-terracotta"
        >
          Start the assessment
        </Link>
        <p className="text-xs text-muted">About 6–8 minutes · Photos stay in this session</p>
      </div>

      <ol className="mt-14 grid gap-4 md:grid-cols-2">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-[24px] border border-white/80 bg-card/90 p-5 shadow-soft">
            <p className="text-[11px] tracking-[0.2em] text-clay">{s.n}</p>
            <h2 className="mt-1 font-serif text-2xl text-ink">{s.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
          </li>
        ))}
      </ol>

      <section className="mt-14 rounded-[28px] bg-ink px-6 py-8 text-ivory md:px-10">
        <h2 className="font-serif text-2xl md:text-3xl">What the analyzer looks for</h2>
        <p className="mt-2 max-w-2xl text-sm text-sand">
          Strictly pixel data. If a trait is sensory or microscopic, we ask you — we do not invent it from a photo.
        </p>
        <ul className="mt-6 grid gap-2 text-sm md:grid-cols-2">
          {[
            "Signs of aging — structural shadows, laxity, creasing",
            "Uneven tone — melanin clusters, sun spots",
            "Congestion — comedones, blackheads, enlarged pores",
            "Texture — uneven topography, indentations",
            "Look of redness — saturation shifts, flushing",
            "Visible shine — high light reflection",
            "Eye care — orbital shadows, under-eye volume",
            "Dullness — low light return, ashy undertone",
          ].map((item) => (
            <li key={item} className="border-t border-white/10 py-2 text-cream">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted">
        Dryness is only flagged when flaking or scaling is visible. Barrier support is
        <em> requires_user_input</em> unless inflammation is extreme. Antioxidant support is
        always recommended. Progress can be saved and resumed at <code>/quiz/resume/[id]</code>.
      </p>
    </main>
  );
}
