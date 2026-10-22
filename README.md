# Partner Portal

A React + TypeScript (Vite) partner portal with:

- **Dashboard**: unread counts, latest notifications and messages, upcoming tasks, pipeline by stage
- **Notifications** from the management team: filter by type, expand to read, mark read/unread
- **Messages**: threaded conversations with the management team, with replies
- **Documents**: drag-and-drop upload with category, description and related account, plus search and delete
- **CRM**: accounts (with a detail view), contacts, an opportunity pipeline board (drag cards or use the stage picker) and tasks

The styling uses the Dark Purple brand colour (`#1D0743`, Pantone 2755c) and its 80/60/40/20% tints, defined as CSS variables at the top of `src/theme.css`.

## Running

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds the site with Vite on every push to `main` or `feature/partner-portal`, and deploys it to GitHub Pages. Pull requests run the build only, as a check.

- One-time setup: in **Settings → Pages**, set **Source** to **GitHub Actions**.
- The site is served at `https://<owner>.github.io/<repo>/`. The workflow passes `BASE_PATH=/<repo>/` to Vite, and the router uses it as its basename.
- `index.html` is copied to `404.html` so deep links (e.g. `/crm/opportunities`) load the app.
- Pages hosting is public. The live site shows dummy data only. Don't point it at real Dataverse data without adding authentication.

## Data and Dataverse

All data access goes through the `DataService` interface (`src/services/dataService.ts`). There are two implementations:

| Implementation | File | Used when |
| --- | --- | --- |
| `MockDataService` | `src/services/mockDataService.ts` | default: in-memory dummy data from `src/data/mockData.ts`; changes reset on reload |
| `DataverseDataService` | `src/services/dataverseService.ts` | `VITE_DATA_SOURCE=dataverse` |

The UI works with the domain types in `src/types.ts` and never sees Dataverse column names. All mapping happens in `dataverseService.ts`.

### Table mapping

| Portal concept | Dataverse table |
| --- | --- |
| Accounts / Contacts / Opportunities | `account` / `contact` / `opportunity` |
| Tasks | `task` (regarding an account) |
| Documents | `annotation` (note with file attachment, regarding an account) |
| Notifications | custom `pp_notification` |
| Messages | custom `pp_message` (grouped by `pp_threadid`) |

The `pp_` publisher prefix and the custom-table column names are placeholders. Change them to match your solution.

### Steps to go live

1. Create the custom tables (`pp_notification`, `pp_message`) in your solution.
2. Register an Entra ID app with the Dataverse `user_impersonation` permission, add `@azure/msal-browser`, and replace the `getToken` stub in `src/services/index.ts` with an MSAL token call.
3. Copy `.env.example` to `.env.local` and set `VITE_DATA_SOURCE=dataverse` and `VITE_DATAVERSE_URL`.
4. Map `account.industrycode` (a choice column) on create and update in `fromAccount`.
5. Scope the queries to the signed-in partner, for example by filtering on the partner's account or by relying on Dataverse security roles.

If external partners will sign in, consider hosting through Power Pages, which handles external identity and uses the same Web API shape.
