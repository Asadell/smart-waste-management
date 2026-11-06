# Routes

File-based routing (TanStack Router). Each file here is one route; `src/routeTree.gen.ts` is generated with
`bun run routes` after adding or renaming a file.

| File | URL | Access |
| --- | --- | --- |
| `__root.tsx` | app shell (toaster, auth provider, document title) | - |
| `index.tsx` | `/` → redirects to `/dashboard` or `/login` | - |
| `login.tsx`, `register.tsx` | `/login`, `/register` | public |
| `_authenticated.tsx` | layout that requires login (sidebar + header) | signed in |
| `_authenticated.dashboard.tsx` | `/dashboard` | signed in |
| `_authenticated.reports.index.tsx` | `/reports` (filters validated from the URL) | signed in |
| `_authenticated.reports.new.tsx` | `/reports/new` | signed in |
| `_authenticated.reports.$id.index.tsx` | `/reports/:id` | owner / admin |
| `_authenticated.reports.$id.edit.tsx` | `/reports/:id/edit` | owner (pending) / admin |
| `_authenticated.users.tsx` | `/users` | admin |
| `_authenticated.map.tsx` | `/map` | admin |
| `_authenticated.profile.tsx` | `/profile` | signed in |

Admin-only pages are wrapped in `AdminOnly` (`src/components/RoleRoute.tsx`); the API enforces the same rules.
