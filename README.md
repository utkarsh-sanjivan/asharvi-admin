# Asharvi Admin (Work 8 – Hardening)

Asharvi Admin is a React + Vite single-page application prepared for GitHub Pages hosting under `/asharvi-admin/`. Work 8 adds production-grade hardening: friendlier error handling, request correlation headers, 429 rate-limit UX, diagnostics logging, and documentation for backend CORS/cookie requirements.

## Tech Stack
- React (JavaScript) + Vite
- React Router v6 (BrowserRouter with GitHub Pages fallback)
- Material UI (MUI) components
- CSS Modules for custom styling
- Deployment via `gh-pages`

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   - Copy `.env.example` to `.env.local` (or `.env`) and adjust if needed.
   ```bash
   cp .env.example .env.local
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```
   The app expects the base path `/asharvi-admin/`; Vite’s dev server serves at `http://localhost:5173/asharvi-admin/`.

4. **Build for production**
   ```bash
   npm run build
   ```
   Output is emitted to `dist/` with asset URLs rooted at `/asharvi-admin/`.

5. **Preview the production build**
   ```bash
   npm run preview
   ```

## CI/CD & Deployment
- Pull requests into `main` trigger the CI workflow (`.github/workflows/ci-cd.yml`) to run `npm ci`, optional `lint`/`test` scripts (via `--if-present`), and `npm run build`, then upload the `dist/` artifact.
- Pushes/merges to `main` rerun CI and deploy the built `dist/` to the `gh-pages` branch via GitHub Actions (`peaceiris/actions-gh-pages@v4`) using the repo token with `force_orphan` to keep history clean.
- The Vite base path is already `/asharvi-admin/`; builds published to `gh-pages` honor that path.

### GitHub Pages setup (one-time)
1. Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Branch: **`gh-pages`**; Folder: **`/ (root)`**.

### Deployed URL
The site is served from `https://<org>.github.io/asharvi-admin/`.

> Manual deploy remains available via `npm run deploy`, which publishes `dist/` to the `gh-pages` branch.

## Application Layout (Work 0)
- Persistent left navigation (Dashboard, Courses, Settings)
- Top app bar with environment selector (Staging/Production) persisted to `localStorage` under `ASHRAVI_ADMIN_ENV`
- Production indicator chip when Production is selected
- Placeholder pages for Dashboard, Courses, and Settings with a default redirect from `/` to `/dashboard`

## Environment Configuration
Environment variables are centralized in `src/config/environment.js`.

Available variables (see `.env.example`):
- `VITE_API_BASE_URL_STAGING`
- `VITE_API_BASE_URL_PROD`
- `VITE_AUTH_LOGIN_PATH`
- `VITE_AUTH_REFRESH_PATH`
- `VITE_AUTH_LOGOUT_PATH`
- `VITE_AUTH_ME_PATH`
- `VITE_UPLOAD_THUMBNAIL_PATH`
- `VITE_UPLOAD_ATTACHMENT_PATH`

Utility behaviors:
- `getApiBaseUrl(env)` returns the base URL for `staging` or `production`.
- Selected environment persists in `localStorage` as `ASHRAVI_ADMIN_ENV`.
- Switching environments recreates the API client and re-validates the session; expect to log in per environment.

## Authentication & Sessions
- Login uses `POST {BASE_URL}{LOGIN_PATH}` with `{ email, password }`.
- Access tokens are expected in a readable `access_token` cookie; refresh tokens are stored server-side in HttpOnly cookies.
- All requests send `credentials: "include"` to support refresh flows.
- On `401`, the API client attempts a single refresh (`POST {REFRESH_PATH}`) and retries the original request once. If refresh fails, the user is logged out locally and redirected to `/login`.
- Session validation prefers `GET {ME_PATH}` and falls back to decoding JWT claims to extract the `admin` role.
- Logout calls `{LOGOUT_PATH}` when available, then clears local session state.
- Every request includes correlation/audit headers:
  - `X-Request-Id` (uuid v4 per request)
  - `X-Client-App: asharvi-admin`
  - `X-Client-Version: <package.json version>`
  - `X-Client-Env: staging|production`
  - `X-Client-User-Agent` (shortened browser UA, omitted if too long)
  - Uploads include the same headers alongside the `Authorization` bearer token when present.

> **CORS note:** Your API must allow cross-origin requests with credentials and set cookies for the configured domain. Ensure `Access-Control-Allow-Credentials: true` and appropriate `Access-Control-Allow-Origin` are configured.

## Upload configuration (Work 6)
- Thumbnail uploads call `POST {BASE_URL}{VITE_UPLOAD_THUMBNAIL_PATH || /admin/uploads/thumbnail}` with `multipart/form-data` field `file`.
- Download lesson attachments call `POST {BASE_URL}{VITE_UPLOAD_ATTACHMENT_PATH || /admin/uploads/attachment}` with `multipart/form-data` field `file`.
- Both endpoints expect a `200` JSON response shaped as `{ url: "https://..." }`; the returned `url` is stored on the course (`thumbnailUrl`) or lesson (`attachments[]`).
- Uploads include cookies and an `Authorization: Bearer <access_token>` header when available. On a `401`, the client refreshes the session once and retries the upload.
- Client-side validation defaults:
  - Thumbnail: image files only, max size 5 MB.
  - Attachments (download lessons): pdf, doc, docx, ppt, pptx, xls, xlsx, zip, png, jpg, jpeg; max size 20 MB.
- UI features: drag-and-drop zones, progress indicators, thumbnail preview with remove, attachment lists with remove, and retry by re-uploading a file.

## Routing & Access Control
- `/login` is public.
- `/dashboard`, `/courses`, and `/settings` are protected by `RequireAuth` (must be logged in) and `RequireAdmin` (must include `admin` role); unauthorized users see a 403 page.
- Unknown routes inside the shell show a not-found page; unknown routes outside redirect to `/login`.

## Error handling, rate limiting, and diagnostics
- Render-time errors are caught by a top-level Error Boundary with a friendly reload + “copy details” UI.
- API errors are normalized with actionable messaging for 401/403/404/409/429/5xx; no stack traces are shown to users.
- `429 Too Many Requests` is parsed for `Retry-After` (seconds or HTTP date). List fetches show inline countdown banners; mutations show a warning toast with a retry button enabled after the countdown.
- Destructive actions in production require stronger confirmation (deletes prompt for slug entry).
- A lightweight diagnostics modal (Settings → “Open diagnostics”) exposes the last 200 client events (login/logout, env changes, refresh attempts, course actions, uploads, rate-limit hits). Data is kept in-memory only; no analytics services are used.

## Project Structure
```
├── public/
│   └── 404.html          # GitHub Pages SPA fallback
├── src/
│   ├── app/              # App bootstrap and routing + route guards
│   ├── api/              # Fetch wrapper with refresh-and-retry
│   ├── auth/             # Auth context and helpers
│   ├── components/       # Layout and shared UI
│   ├── config/           # Environment utilities
│   ├── pages/            # Page-level components
│   └── styles/           # CSS Modules + globals
├── index.html            # Entry with SPA redirect helper
├── vite.config.js        # Base path set to /asharvi-admin/
└── package.json
```

## Commands
- `npm run dev` – start local development server
- `npm run build` – create production build
- `npm run preview` – preview build locally
- `npm run deploy` – build and publish to GitHub Pages (`gh-pages` branch)

## Backend requirements (CORS, cookies, HTTPS, rate limiting)
- **Origins**: Allow `Access-Control-Allow-Origin` for your GitHub Pages origin (e.g., `https://<org>.github.io`) and any custom domain used. Avoid `*` when `credentials` are required.
- **Credentials**: Send `Access-Control-Allow-Credentials: true`; clients always send cookies.
- **Cookies**: Refresh token cookies should be `HttpOnly; Secure; SameSite=None` for cross-site usage. Staging over plain HTTP will not accept `Secure` cookies—prefer HTTPS in all environments.
- **Preflight**: Allow headers `Authorization`, `Content-Type`, `X-Request-Id`, `X-Client-App`, `X-Client-Version`, `X-Client-Env`, `X-Client-User-Agent`.
- **Rate limiting**: Return `429` with a standard error payload and `Retry-After` (seconds or HTTP date). The UI reads `Retry-After` to show countdowns and disables retry buttons until the window expires.
- **Logging**: Log `X-Request-Id` and `X-Client-*` headers on the backend for traceability; avoid persisting PII in logs.

## Notes
- API calls are environment-aware and include the `Authorization: Bearer <token>` header when the `access_token` cookie is present.
- Keep the base path `/asharvi-admin/` consistent across hosting and local previews.
- The Settings page shows the current client version and exposes diagnostics for support/debugging.
