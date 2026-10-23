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
- Data access goes through react-query hooks in `src/lib/api.ts` using the browser client; tables are intentionally open to anon (no-login shared tool by requirement).
- Selected period/view are kept in URL search params so navigation between clients preserves them.
