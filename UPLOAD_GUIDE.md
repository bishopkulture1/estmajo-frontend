# ESTMAJO FRONTEND — upload to `bishopkulture1/estmajo-frontend`

Target branch: `estmajo-frontend-update` (create it from `main`). DO NOT upload to the backend repository.

Unzip this archive and upload its **contents** to the branch root: `src/`, `public/`, `netlify/`, `index.html`, `package.json`, `package-lock.json`, `netlify.toml`, and configuration files. Do not upload the ZIP as a single repo file. Preserve existing source files.

This is the original React 19 + TypeScript + Vite app with these targeted frontend adjustments:
- Confirmed company details and service list render immediately as fallback while Render wakes; dynamic backend data replaces them on success.
- The original logo pulses with **LOADING…** in a visible section when public backend data, owner connection or upload is pending.
- An image or video selected from the device gallery can be viewed/played locally during upload. When the backend confirms upload, the signed saved media is displayed in the administrator media library; images and videos also open in a larger viewer. A separate Publish to gallery action keeps the upload private until approved.
- Only existing owner/administrator sign-in is retained; no manager sign-in added.
- Existing same-origin Netlify Edge Function preserved.

**Important deployment prerequisites:** `DJANGO_API_ORIGIN` and `NETLIFY_PROXY_SECRET` must be configured privately on Netlify and the same proxy secret on Render. `VITE_PUBLIC_PREVIEW=true` must NOT be enabled on production when the Django backend is expected to work; it intentionally disables live owner features. Do not place secrets in VITE variables.

**To remove the Netlify platform watermark:** Netlify project dashboard → **Project configuration > General > Powered by Netlify badge > Off > Save**. This is an account/site setting, not a change that can be guaranteed by editing source code. It does not require a redeploy.

**Validation remaining:** Run `npm ci && npm run build`, test signed ImageKit playback on the deployed domain, verify database/owner login and the Netlify badge setting. The package has not been deployed to or tested against the live production services.
