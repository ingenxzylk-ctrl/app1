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

Vision defaults to **`gemini-2.5-flash`** — match a model that shows quota in AI Studio → Rate Limit (not `0 / 0`). Your screenshot shows these typically work on free tier:

- `gemini-2.5-flash` (default)
- `gemini-3-flash`
- `gemini-2.5-flash-lite`

Put the model id in `backend/.env` (optional — the server auto-detects models your key can use):

```
GEMINI_MODEL=gemini-2.5-flash
```

Check http://localhost:3001/api/health:

- **`geminiReachable: true`** — Google accepted a call
- **`geminiModelsAvailable`** — models your API key can list (from Google)
- **`geminiModelsTried`** — order the server attempted

Do not use retired ids like `gemini-2.5-flash-lite` (404 for new users).

### Gemini 429 quota exceeded

Your health JSON showed **429** after trying many models — that burns free-tier quota fast (~**20 requests/day** on Flash). The server now uses **one model per session** and stops immediately on 429.

If you see `"aiMode": "gemini-quota"`:

1. **Wait** until your daily quota resets (check AI Studio → Rate Limit → RPD).
2. Do **not** refresh `/api/health` repeatedly — each check uses 1 API call.
3. Set one model in `backend/.env` (recommended for free tier):
   ```
   GEMINI_MODEL=gemini-3-flash-preview
   ```
4. Enable **billing** in AI Studio for higher limits.
5. The quiz still completes via **offline fallback** when quota is gone.

### Gemini 403 “project has been denied access”

Usually the **model id does not match your quota**. Models showing `0 / 0` in Rate Limit will return 403 or 404. Fix:

1. Set `GEMINI_MODEL=gemini-2.5-flash` in `backend/.env` (or `gemini-3-flash`).
2. Restart `npm run dev`.
3. Open http://localhost:3001/api/health — want `"geminiReachable": true`.
4. If still blocked: **Set up billing** in AI Studio, create a **new API key**, or contact Google support.

While Gemini is blocked, the quiz still completes using an **offline fallback** (your answers, not the photo).
