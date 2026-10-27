# ESTMAJO FRONTEND — CORRECTED APPLICATION CODE

Repository: https://github.com/bishopkulture1/estmajo-frontend
**EXISTING update branch: `estmajo_frontend_update` (with underscores).** Do not commit to `main`.

This ZIP contains the complete frontend source, with files at the repository root. Extract it first. On GitHub, switch to the update branch before editing/uploading. If uploading from a phone, open each destination folder and replace the corresponding file, rather than uploading another ZIP or placing the entire extracted folder inside the repository.

## Files to replace on your already-created update branch

- `src/main.tsx` — static confirmed content appears immediately without waiting for Render.
- `src/shared.tsx` — visible and fixed JSX for real image/video rendering and pulsing logo LOADING indicator.
- `src/api.ts` — request activity indicator and existing same-origin API calls.
- `src/owner.tsx` — device gallery upload display, image viewer, playable video, fresh signed playback link, manual publish/unpublish.
- `src/styles.css` — original styles plus compact loading indicator and media viewer styles.
- `src/public-fallback.ts` — public confirmed details and services while backend loads (include if missing).
- `netlify.toml` — CORRECTED for standalone frontend repo root: `npm ci && npm run build`, publish `dist`.
- `UPLOAD_GUIDE.md` — updated upload guidance; optional for deployment.

The other files in this ZIP preserve the original React + TypeScript + Vite architecture. Preserve `public/brand/estmajo-logo.jpg`, `netlify/edge-functions/django-api.ts`, and all existing project config. Do not upload `.env` secrets.

**Deployment order:** Test and deploy the compatible backend update first, then frontend. Render's free service may take time to start; the public site remains visible and a non-blocking pulsating ESTMAJO logo with bold **LOADING…** appears during backend operations. A file's private ImageKit link expires and is renewed on view/play.

**Important:** This archive was syntax-checked, but a full npm dependency build and live Netlify/Render/ImageKit test could not be run here. Do not merge without verifying `npm ci && npm run build`, owner login, gallery/image/video playback, and public site navigation on a test deployment.

**Netlify platform badge:** Remove it from the Netlify site's dashboard (Project configuration → General → Powered by Netlify badge, if that option is shown). Source code cannot turn off Netlify's account-level badge. Changing the branding setting does not require changing hosting.
