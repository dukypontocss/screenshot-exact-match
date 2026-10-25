<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## ATA architecture
- Business rules (periods, BR number parsing, month attribution, CPL consolidation) live as pure functions in `src/lib/ata.ts` with tests in `src/test/ata.test.ts`; why: calculations must stay consistent across pages.
- Data access goes through react-query hooks in `src/lib/api.ts`, which call the REST client in `src/lib/apiClient.ts` against the Express + MongoDB backend in `server/`; why: the user migrated the app off the managed database to MongoDB Atlas + Render in their own commits (24/10). Do not reintroduce managed-database data access without asking.
- `src/lib/apiClient.ts` translates the backend's `_id`/camelCase into the frontend's `id`/snake_case and back; new fields must be added to those key maps or they arrive with the wrong name.
- The app is a no-login shared internal tool: the backend has no auth, so it must never hold data that needs protecting.
- Selected period/view are kept in URL search params so navigation between clients preserves them.
