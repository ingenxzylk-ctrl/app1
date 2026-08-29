# Facial Skin Analysis

A cosmetic facial assessment modeled on the Hair & Scalp Health quiz architecture: tray-style sections, gender-branched questions, local + server persistence, a vision pass, then a rule-based result engine.

This is **not** a medical product. The analyzer describes visible surface traits and emits **treatment pathway codes** (for example `BHA_Exfoliant`, `Pigment_Inhibitor`) so a catalog backend can attach native products. It never names brands or diagnoses conditions.

## Journey

```
Landing /  →  Quiz /quiz
                 Section 0  About you          (everyone)
                 Section 1  Skin profile       (female / male)
                 Section 2  Lifestyle          (female 10q / male 8q)
                 Section 3  Face scan + AI     (everyone)
                 Results
Resume /quiz/resume/[id]
```

Unlike the hair quiz (scalp scan is male-only), **both gender paths take the face scan**. Gender still routes question copy and lifestyle factors (cycle / life stage vs. shaving).

The orchestrator is `src/app/quiz/page.tsx`. It maps `state.currentSection` (0–3) to section components and calls `handleFinish(analysis)` so the result engine receives the scan payload directly (avoids stale React state).

## State & persistence

Everything lives in `QuizContext` (`src/context/QuizContext.tsx`):

| Field | Purpose |
| --- | --- |
| `sessionId` | UUID for this attempt |
| `aboutMe` | Name, WhatsApp, email, age, gender (routing key), self-reported skin type |
| `answers[]` | `{ section, question_id, gender_path, value }` |
| `faceImages` | Front + 45° photos |
| `aiAnalysis` | Gemini (or fallback) surface-trait prediction |
| `result` | Final computed report |
| `currentSection` / `currentStep` | Navigation |

On every state change, progress is written to `localStorage` (`facial-skin-quiz-state`). Server save/resume uses:

- `POST /api/quiz/save` → `{ resumeUrl }`
- `GET /api/quiz/resume/[id]` → restore session

The in-memory store resets when the Node process restarts.

## Sections

**0 — About you** (`Section0AboutMe.tsx`)  
Full name → WhatsApp + email → age range → gender + skin type → `goToSection(1)`.

**1 — Skin profile**  
Female (`Section1SkinProfileFemale.tsx`, 6 steps): concerns, duration, makeup, routine, actives, sun.  
Male (`Section1SkinProfileMale.tsx`, 6 steps): concerns, duration, facial hair, routine, actives, sun.  
→ `goToSection(2)`.

**2 — Lifestyle**  
Both paths start with a privacy gate.  
Female (`Section2LifestyleFemale.tsx`, 10): sleep, stress, water, diet, environment, sensitivity, life stage, cycle skin, food habits, smoking.  
Male (`Section2LifestyleMale.tsx`, 8): sleep, stress, water, diet, environment, sensitivity, shave, smoking.  
→ `goToSection(3)` (face scan for everyone).

**3 — Face scan** (`Section3FaceScan.tsx`)  
Consent → photo guide → front photo → 45° photo → analyzing.

Per image: `POST /api/skin/moderate` (NSFW + face visibility; Gemini when `GEMINI_API_KEY` is set).  
After both images: `POST /api/skin/analyze` with front + three-quarter, gender, age, skin type, session ID, answers.

Then: `setAIAnalysis(analysis)`, `setFaceImages(...)`, `onComplete(analysis)`.

## Analyzer contract

The Gemini system prompt in `src/lib/gemini.ts` is the dermatological computer-vision spec:

- Aging, uneven tone, congestion, texture, look of redness, visible shine, eye care, dullness — pixel data only.
- Dryness / dehydration — `true` only if flaking or scaling is visible.
- Barrier / sensitive skin — `requires_user_input` unless extreme visible inflammation or scaling.
- Antioxidant support — always `recommended`.
- No medical diagnoses (“look of redness”, never “rosacea”).
- No product or brand names — pathways only.

Without `GEMINI_API_KEY`, moderation accepts any `data:image/…` payload and analysis uses `fallbackAnalysis()` so the flow still completes offline.

## Results

`generateResult` in `src/lib/result-engine.ts`:

1. **Trait reconciliation** — AI vs self-report; low confidence (&lt;70%) is called out; dryness stays self-reported if the photo shows no flaking; barrier prefers user input.
2. **Contributing factors** (up to 3) — UV, stress, sleep, hormones, shaving, environment, diet.
3. **Outlook + up to 4 pathways** — including `Daily_SPF` when sun habits are weak, and `Antioxidant_Defense` from the always-on trait.

`ResultsPage.tsx` shows the snapshot, confidence bar, mismatch notes, color-coded factors, outlook, pathway codes, and optional save/resume.

## Develop

```bash
npm install
cp .env.example .env.local   # optional GEMINI_API_KEY
npm run dev
npm test
npm run build
```

Open [http://localhost:3000](http://localhost:3000).
