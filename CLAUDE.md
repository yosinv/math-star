# Math Star — notes for Claude

Read `docs/HANDOFF.md` before changing anything: architecture, decisions, open tasks and known traps.

- Push to `main` = production deploy (Cloudflare Workers Builds). Check `gh api repos/yosinv/math-star/commits/<sha>/check-runs` afterwards.
- Run `npm test` before every push.
- Accounts, kids and the parent PIN are shared with English Star (same Clerk app, same D1). Never store a Clerk secret here.
- Keep guest (device-only) mode working.
- New child-facing feminine Hebrew needs a masculine entry in `public/js/gender.js`.
