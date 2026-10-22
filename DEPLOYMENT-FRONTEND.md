# ESTMAJO Netlify frontend

Deploy this folder as the repository root, or configure it as the Netlify base directory. Build: `npm ci && npm run build`. Publish: `dist`.

Set Netlify runtime Edge Function environment variables `DJANGO_API_ORIGIN` (actual Render HTTPS origin, no `/api`) and `NETLIFY_PROXY_SECRET` (32+ character secret, identical to Render setting). Set Django `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` to actual deployed domains. Do not put secrets in source or use `VITE_` prefix.

Do not set `VITE_PUBLIC_PREVIEW=true` in production. Verify real `/api/public/`, admin login, CSRF, content persistence, enquiry, media and email after backend deployment. Large uploads may exceed edge limits. This archive does not deploy the backend or database.
