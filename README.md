# Asharvi Admin (Work 1 + 2)

Asharvi Admin is a React + Vite single-page application prepared for GitHub Pages hosting under `/asharvi-admin/`. Work 1 + 2 adds authenticated access, environment-aware API calls with refresh-on-401, and protected routes for admin-only areas.

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

## Deployment (GitHub Pages)

This project uses the `gh-pages` package to publish `dist/` to the `gh-pages` branch.

```bash
npm run deploy
```

Notes:
- Ensure your repository’s Pages settings point to the `gh-pages` branch (root).
- `vite.config.js` sets `base: '/asharvi-admin/'`, and React Router uses `basename="/asharvi-admin"`.
- GitHub Pages SPA refresh support is handled via `public/404.html` and the redirect helper in `index.html`.

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

> **CORS note:** Your API must allow cross-origin requests with credentials and set cookies for the configured domain. Ensure `Access-Control-Allow-Credentials: true` and appropriate `Access-Control-Allow-Origin` are configured.

## Routing & Access Control
- `/login` is public.
- `/dashboard`, `/courses`, and `/settings` are protected by `RequireAuth` (must be logged in) and `RequireAdmin` (must include `admin` role); unauthorized users see a 403 page.
- Unknown routes inside the shell show a not-found page; unknown routes outside redirect to `/login`.

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

## Notes
- API calls are environment-aware and include the `Authorization: Bearer <token>` header when the `access_token` cookie is present.
- Keep the base path `/asharvi-admin/` consistent across hosting and local previews.
