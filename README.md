# MILC Facial Skin Analysis

React frontend + Express backend. Same cosmetic facial assessment as before — gender-branched quiz, face scan, Gemini (or offline fallback), treatment pathway codes. No product names. No medical diagnoses.

```
frontend/   Vite + React + Tailwind     http://localhost:5173
backend/    Express API                 http://localhost:3001
shared/     Types, questions, result engine
```

## Run both together

```bash
npm install
cp .env.example backend/.env   # optional GEMINI_API_KEY
npm run dev
```

That starts:

- `backend` — `[milc] server listening on http://localhost:3001`
- `frontend` — Vite on http://localhost:5173, proxying `/api` to the backend

Or separately:

```bash
npm run dev:server    # workspace backend
npm run dev:client    # workspace frontend
```

## Why `git pull` failed on your machine

Your local folder `appmilc\app` is pointed at:

`https://github.com/ingenxzylk-ctrl/app.git/`

This project lives at:

`https://github.com/ingenxzylk-ctrl/app1`

Either change the remote:

```bash
git remote set-url origin https://github.com/ingenxzylk-ctrl/app1.git
git pull origin main
```

or copy the `frontend/`, `backend/`, and `shared/` folders into your MILC repo (and keep the root `package.json` workspaces).

The earlier error `No workspaces found: --workspace=client` means the `client` folder was missing. This repo uses **`frontend`** and **`backend`**. Root scripts still expose `dev:client` / `dev:server`.

## API

| Route | Role |
| --- | --- |
| `GET /api/health` | Liveness + AI mode |
| `POST /api/quiz/save` | Persist session |
| `GET /api/quiz/resume/:id` | Restore session |
| `POST /api/skin/moderate` | Image safety + face check |
| `POST /api/skin/analyze` | Gemini vision (or fallback) |

Without `GEMINI_API_KEY`, analysis maps your answers so the quiz still finishes.

Vision uses `gemini-3.6-flash` by default. Override with `GEMINI_MODEL` in `backend/.env` if Google retires that id.

### Gemini 403 “project has been denied access”

This is a **Google AI Studio / billing / project** issue, not an app bug. From your dashboard screenshot, common fixes:

1. Click **Set up billing** in [Google AI Studio](https://aistudio.google.com/) (Usage & Billing).
2. Create a **new API key** under API Keys and paste it into `backend/.env`.
3. Confirm **Rate Limit** — if RPM is over the limit (e.g. 6/5), wait a minute or request a higher quota.
4. If it still says *denied access*, use **Contact support** in AI Studio — the project may be blocked.

While Gemini is blocked, the quiz still completes using an **offline fallback** (your answers, not the photo). Results will show low confidence and mention the fallback.
