# Math Star — notes for Claude

Read `docs/HANDOFF.md` before changing anything: architecture, decisions, open tasks and known traps.

- Push to `main` = production deploy (Cloudflare Workers Builds). Check `gh api repos/yosinv/math-star/commits/<sha>/check-runs` afterwards.
- Run `npm test` before every push.
- Accounts, kids and the parent PIN are shared with English Star (same **production** Clerk app, same D1). Never store a Clerk secret here.
- Live address: https://math.englishstarkids.com (production Clerk only runs on englishstarkids.com subdomains). The old workers.dev address is device-only plus a "move" button.
- Never create a `families` row except when a parent adds a child: English Star moves old families to the new sign-in only while no family exists for the new ID.
- Keep guest (device-only) mode working.
- Kid phones: `kidDeviceAllowed` in `src/worker.js` is the allowlist for a phone (one child, no parent actions). Any new API route is refused on kid phones until added there on purpose.
- Privacy page: `public/privacy.html`. Update it when what is stored changes.
- New child-facing feminine Hebrew needs a masculine entry in `public/js/gender.js`.
