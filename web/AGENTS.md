## Stack
- Pure Vite SPA (no SSR): `index.html` -> `src/main.tsx` -> `src/router.tsx`. Build output is static `dist/index.html` + `dist/assets/`.
- TanStack Router (client-side, file-based). `src/routeTree.gen.ts` is generated with `bun run routes`; do not add `@tanstack/react-start`, `@tanstack/router-plugin`, `nitro`, or SSR APIs (`HeadContent`, `Scripts`, `shellComponent`, `?url` CSS imports).
- Per-route `head().meta` titles are applied to `document.title` by `useDocumentTitle` in `src/routes/__root.tsx`.
- Do not use em-dash or en-dash characters in UI text; use a plain hyphen.

## Architecture
- Pages use `src/services/*` (fetch client in `services/http.ts` against the Laravel API at `VITE_API_URL`) via TanStack Query hooks in `src/hooks`; pages never call `fetch` directly.
- API shapes live in `src/types` and follow the Laravel API resources. Report permissions come from `report.can` (backend policy), never recomputed in the UI.
- Auth: `AuthProvider`/`useAuth` keeps the Sanctum token in localStorage, validates it with `/auth/me` on load, and clears the session on any 401. `_authenticated` layout guards routes, `AdminOnly` guards admin pages.
- File uploads on update use `POST` + `_method=PUT` (`withMethod`), because PHP does not parse multipart PUT bodies.
- Leaflet is loaded only via lazy wrappers in `src/components/map/Maps.tsx` to keep it out of the main bundle.
- Recharts SVG fills must use literal colors (`hex` in `lib/constants.ts`), not CSS `var()`, in Pie cells.
