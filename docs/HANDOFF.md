---
title: Math Star — handoff for Claude Code
project: Math Star
aliases: [Math Star handoff, math-star]
tags: [project/math-star, kids, cloudflare, handoff]
status: live
updated: 2026-11-10
repo: https://github.com/yosinv/math-star
live: https://math.englishstarkids.com
related: "[[English Star]]"
---

# Math Star — handoff

> [!info] How to use this note
> Paste this whole note to Claude Code (or keep it in the Obsidian vault and point Claude Code at it).
> It is the full context of the session that built Math Star (21 Oct – 1 Nov 2026): what exists,
> why it was built that way, what is done, what is still open, and the traps already found.
> Its home is the repo at `docs/HANDOFF.md`, and `CLAUDE.md` at the repo root points to it — keep that copy current, not a stale vault copy.

## 1. What Math Star is

A Hebrew (RTL) math-practice website for Yosi's kids, built as the sibling of [[English Star]]
(same look — "Block World", same rewards: XP, gems, daily streak, levels).

- **Live:** https://math.englishstarkids.com (since Nov 2026; the old https://math-star.yosinv.workers.dev is device-only and offers to move progress)
- **Repo:** `yosinv/math-star` (private). Renamed on 21 Oct from `math-start` — GitHub redirects the old name.
- **Deploy:** Cloudflare Workers Builds, Worker `math-star`. Every push to `main` builds and deploys
  (no build command; deploy command `npx wrangler deploy`).
- **Sibling:** `yosinv/english-star` (private, Cloudflare Worker `english-star-multiuser`) and
  `yosinv/english-star-public` (public showcase; the README links there).
- **Audience:** grades גן → ו׳, boys and girls. Two real tracks are aligned with actual school material:
  - **כיתה ו׳** ← the class review booklet (`חוברת חזרה – כיתה ו׳`, topics 1.1–4.5).
  - **כיתה ד׳** ← the class test notice for **Alma** (test on **Sunday 15/11/2026**, 13 topics).

## 2. Architecture

```
math-star/
├─ src/worker.js        Hono app on /api/* only; everything else → static assets
├─ wrangler.jsonc       D1 binding to English Star's DB, Clerk publishable + PUBLIC JWT key
├─ public/
│  ├─ index.html        who's playing → child's world (missions, skill map, test countdown)
│  ├─ practice.html     ?skill=<id> | ?mode=review | ?mode=exam | ?hw=<id>
│  ├─ games.html        Number Rush (60s), Block Tower (build 10)
│  ├─ homework.html     parent types worksheet exercises → auto-checked round
│  ├─ progress.html     "איך הצלחתי?" table, exam history, parent settings, backup
│  ├─ test.html         "הכנה למבחן": countdown, per-topic status, today's picks
│  ├─ css/style.css
│  └─ js/
│     ├─ engine.js      skill catalog גן–ה׳, generators, adaptivity, homework parser (exact fractions)
│     ├─ grade4.js      כיתה ד׳ track = the test notice's 13 topics
│     ├─ grade6.js      כיתה ו׳ track = the review booklet's topics 1.1–4.5
│     ├─ gender.js      feminine text → masculine for boys (explicit word list)
│     ├─ store.js       device storage (localStorage "mathstar.v1"), rewards, mergeKids
│     ├─ session.js     one interface for guest (device) and cloud (signed-in) modes
│     ├─ account.js     Clerk loader, API fetch, debounced saver (+keepalive on pagehide)
│     ├─ parent-pin.js  copied from English Star (sessionStorage key mathStarParentUnlock)
│     └─ ui.js          QuestionView, keypad, SVG figures, toasts, requireProfile()
└─ test/engine.test.js  node --test; fuzzes every skill/level, cross-checks answers
```

### Data and accounts (same model as English Star)

- **Parent sign-in:** English Star's **production** Clerk app (`pk_live…`, frontend `https://clerk.englishstarkids.com`). It only runs on englishstarkids.com and its subdomains — that is why Math Star moved to `math.englishstarkids.com`. (Until Nov 2026 it used the old dev instance `legible-ibex-1897`.)
- **Kids:** rows in English Star's D1 (`families`, `children`). Same kids on both sites; a child added in Math Star appears in English Star.
- **Parent PIN:** English Star's `parent_pins` / `parent_unlocks` tables (PBKDF2, 5 tries → 15-min lock, 15-min unlock token). Set/changed only on English Star's "My Family" page.
- **Math progress:** `math_child_state (child_id PK → children ON DELETE CASCADE, gender, math_grade, state_json, version)`. Created by the Worker on first request (`CREATE TABLE IF NOT EXISTS`) — no migration file.
- **Guest mode (kept on purpose, Yosi's choice):** without sign-in, profiles + progress stay in the browser (`mathstar.v1`). The first sign-in on a device with progress offers to move it into the account (match by name or add the child), then archives a dated copy and clears the device.
- **Sign-in check:** the Worker reads Clerk's **public** keys from `CLERK_FAPI_URL/.well-known/jwks.json` (cached 1 h, refetched for a new key id), verifies the session JWT and requires `iss` = `CLERK_FAPI_URL`. **No Clerk secret is stored on Math Star**; key rotation needs no change. `CLERK_JWT_KEY` (pasted PEM) overrides the fetch; `CLERK_SECRET_KEY` remains a last fallback.
- **Families are created only when a parent adds a child here** — never on a visit. English Star moves a family from the old dev sign-in to the new production ID on the parent's first English Star visit, and only if no family exists yet for the new ID; an empty family made by Math Star first would hide the real one.
- **Rules:** a family only sees its own children (404 otherwise); frozen families get 423; saving progress needs no PIN; adding/renaming a child and *changing* boy/girl or grade needs the PIN (the *first* boy/girl + grade choice on a child's first visit is open).

### API (all need a signed-in parent; `GET /api/health` is public)

| Route | Purpose |
|---|---|
| `GET /api/health` | `{ok, database, signIn}` — quick live check |
| `GET /api/math/me` | family's children with gender and math grade |
| `GET/PUT /api/math/children/:id/state` | load/save one child's progress (≤300 KB JSON) |
| `PATCH /api/math/children/:id/settings` | gender, mathGrade |
| `POST /api/math/children` · `PATCH /api/math/children/:id` | add / rename child (PIN) |
| `GET /api/parent-pin` · `POST /api/parent-pin/unlock` · `POST /api/parent-pin/lock` | shared PIN |

## 3. Product rules worth keeping

- **Adaptivity:** 4 right in a row (first try) → star + level up (1→2→3); 2 misses in a row → level down. Anything not right first try → review queue.
- **Rewards:** +10 XP first try, +5 second try; level every 120 XP; gems per round (3 perfect / 2 ≥70% / 1); +5 gems for all 3 daily missions; daily streak.
- **Every generator makes fresh numbers** — practice the skill, not memorise the booklet.
- **Hebrew:** text is written feminine; `gender.js` rewrites second-person forms for a boy via an explicit word list (never a suffix rule: "חלקי" is also "over" in "3 חלקי 4"). Shared screens use neutral plural ("בחרו", "מי משחק/ת"). Word-problem characters are boys and girls and verbs agree with the character (`person()`).
  > [!warning] Any new child-addressed feminine wording must get its masculine form added to `WORDS` in `gender.js`, or boys will see the girl form.
- **Exam mode:** for grades with a topic list (`UNITS` has ד׳ and ו׳) questions go in topic order, one try, no hints.
- **Not auto-checkable, left on paper:** drawing heights, "explain why", drawing on grid paper.
- **Privacy:** `noindex` everywhere + `robots.txt` disallow; avatars are characters only (same set as English Star), never photos.

## 4. Timeline (what was done)

- [x] **21 Oct** — Built Math Star from scratch (engine, 7 grades, missions, games, homework, progress, exam). Repo created by Yosi as `math-start`, renamed to `math-star`. ✅ 2026-10-21
- [x] **21 Oct** — Rebuilt **כיתה ו׳** around the uploaded review booklet (topics 1.1–4.5) + practice-test mode + "איך הצלחתי?" table. ✅ 2026-10-21
- [x] **22 Oct** — Yosi connected the repo in Cloudflare from his phone; first deploy live. ✅ 2026-10-22
- [x] **23 Oct** — **Boys and girls:** בן/בת per profile, `gender.js`, neutral shared screens, gendered word problems (`f99ac0e`). ✅ 2026-10-23
- [x] **23 Oct** — Fixed Cloudflare **Git connection "disconnected"** (Disconnect → Connect in Settings → Builds); auto-deploy works again (`b7c6eb5`). ✅ 2026-10-23
- [x] **23–24 Oct** — **Shared accounts with English Star** (Clerk + D1 + PIN), guest mode kept, device→account import, reliable saving (`b4d4789`). ✅ 2026-10-24
- [x] **24 Oct** — Switched to Clerk **public-key** verification; no secret needed (`095ff83`). First build stalled on Cloudflare's side; *Retry build* succeeded. `/api/health` → `"signIn": true`. ✅ 2026-10-24
- [x] **1 Nov** — **כיתה ד׳ test prep for Alma:** the notice's 13 topics, new figures (fraction bars, any-step number line, quadrilateral ABCD), `test.html` with countdown + per-topic status + today's picks; place-name Hebrew fix in ד׳ and ו׳ (`d16a2f8`). ✅ 2026-11-01

## 5. Open — needs Yosi (manual)

- [ ] **Sign in once on Math Star with the English Star account** and confirm the family's kids appear (Clerk widget renders on the live site; a full sign-in was never confirmed back).
- [ ] **On the girls' device:** sign in → accept the offer to move device progress into the account (until then progress lives only in that browser; on iPhone/iPad Safari can wipe it after ~7 days unused — open from the Home-Screen icon).
- [ ] **Alma (before 15/11):** on her profile confirm the grade is **כיתה ד׳**, then open once: `https://math.englishstarkids.com/test.html?date=2026-11-15` (if her progress is on the old address, tap "לעבור עם ההתקדמות" there first) 📅 2026-11-14
- [ ] Send **pages 1 and 3** of Alma's test notice — only page 2 was received; they may contain sample questions or more topics.

## 6. Open — for Claude Code (suggested next work)

- [ ] **Verify live sign-in end to end** (with Yosi present): `GET /api/math/me` returns the real family; pick a child → בן/בת setup → answer → `PUT …/state` saved → reload shows it.
- [ ] **Move the browser tests into the repo.** The Playwright e2e scripts (guest flow, signed-in flow with a fake Clerk + self-signed JWT, boy-wording scan, grade-4 pages) and the API test (`api.test.mjs`) lived only in the old session's scratch folder. Recreate them under `test/e2e/` and `test/api/` (see §8 for how they worked).
- [ ] **After 15/11:** ask how Alma's test went; consider adding the next unit for ד׳ and moving `g4_frac_of` out of "בהמשך השנה".
- [x] **Clerk production instance:** moved to English Star's production Clerk, new address `math.englishstarkids.com`, public keys fetched (no rotation watch needed), no empty families, device progress carried from the old address (branch `claude/clerk-production`).
- [ ] After that merge: confirm the custom domain `math.englishstarkids.com` is attached (Cloudflare → math-star → Settings → Domains & Routes) and `/api/health` there shows `"signIn": true`.
- [ ] Later, once the kids have moved: consider redirecting the old workers.dev address to the new one (not done now, because each address keeps its own device progress).
- [ ] Optional: a parent "family dashboard" in Math Star (kids side by side), and an English Star ↔ Math Star cross-link.

## 7. Traps already hit (read before debugging)

> [!bug] Cloudflare stops deploying silently
> Symptom: push lands on GitHub, site doesn't change, no check-run on the commit.
> Cause seen: Cloudflare → math-star → Settings → Builds showed *"This project is disconnected from your Git account."*
> Fix: **Disconnect → Connect** the same repo (`yosinv/math-star`, branch `main`, deploy `npx wrangler deploy`), then push.
> Check from CLI: `gh api repos/yosinv/math-star/commits/<sha>/check-runs` should show *Workers Builds: math-star*.

> [!bug] A build can stall in "Initializing" for minutes and fail
> Not a code problem — use **Retry build** on the build page.

- `/index.html?…` is redirected to `/?…` by Cloudflare (`html_handling: auto-trailing-slash`) — match URLs by query, not path.
- `workers.dev` and `englishstarkids.com` are blocked from cloud sandboxes (so is `clerk.englishstarkids.com`), and `robots.txt` blocks web-fetch tools — check the live site through a real browser.
- Local testing: build a local D1 from **English Star's** `migrations/*.sql`, then `wrangler dev --local --persist-to <dir>`. Kill old `workerd`/`wrangler` processes before deleting the D1 dir (a live process on a deleted DB file → `SQLITE_READONLY_DBMOVED`). Don't `pkill -f wrangler` from a shell whose command line contains "wrangler" — it kills itself.
- `@clerk/backend` top-level `verifyToken()` **returns the claims and throws on failure** (not `{data, errors}`); the Worker handles both.
- Saving: a link click waits for the pending save; "עוד סיבוב" flushes before reload; `pagehide` sends a keepalive PUT. Don't add navigation that bypasses these.

## 8. How it was tested (recreate this)

- `npm test` — fuzzes every skill × level (hundreds of problems each, run with `SEED=1..20`), checks no NaN/negatives, unique choices, answer present, and **cross-checks every expression answer with the homework parser's exact-fraction evaluator**; tests adaptivity, homework parsing, `gtext`, verb agreement, `mergeKids`, grade-4 topic coverage.
- **API tests (in repo: `test/api.test.js`)**: Worker in Node with `node:sqlite` as D1, a locally made RSA key served as a stubbed JWKS; covers 401 cases (none/garbage/unknown key/wrong issuer/expired), no family created on visit, family isolation, save, first child creates the family, JWKS cache + rotation, JWKS down → 503. The older, fuller run used a local D1 (English Star schema + seed: 2 families, kids, PIN 1234), Worker run with `CLERK_JWT_KEY` = a locally generated RSA public key, tokens signed with its private key. Covered: no/forged/expired token → 401, family isolation → 404, state save/version/413/400, PIN required/wrong/unlock/lock, frozen → 423, cascade delete.
- **Browser (Playwright, Chromium):** pages expose `window.__msCurrent` (current problem) so tests can answer. Flows: guest end-to-end on phone + desktop sizes; signed-in flow with a stub `Clerk` served in place of `clerk.browser.js`; scan of all boy-visible text for feminine forms; grade-4 test page.

## 9. Decisions log (why)

| Decision | Why |
|---|---|
| No AI / no photo upload (unlike English Star) | Math problems can be generated in code; homework is typed by the parent. |
| Hebrew UI, feminine default | The kids learn math in Hebrew; the original users are girls. Boys via `gender.js`. |
| Share accounts with English Star | Yosi chose it: one login, one kid list, one PIN. |
| Keep guest mode | Yosi chose it: the site keeps working without sign-in. |
| Public-key JWT verification | Math Star only verifies tokens; the admin secret stays on English Star only. |
| School-material tracks (ד׳, ו׳) | Practice must match what the actual test covers. |

## 10. People and context

- **Yosi** — owner/parent; works in Hebrew and English; prefers direct, challenge-first answers with confidence tags.
- **Alma** — grade ד׳, math test **15/11/2026** (notice: numbers to 1,000,000, place value, four operations, ×10/×100, sequences, order of operations, number line, inequalities, word problems; fractions — meaning, equivalent names; geometry — square/rectangle perimeter & area, diagonals, parallel and adjacent sides).
- Another child uses the **כיתה ו׳** booklet track.

## 11. Copy-paste prompt for Claude Code

```text
You are continuing work on Math Star (repo yosinv/math-star, live at https://math.englishstarkids.com),
a Hebrew math-practice site on Cloudflare Workers that shares accounts (Clerk), kids (D1) and the parent PIN
with English Star. Read docs/HANDOFF.md first: it has the architecture, the decisions, what is done,
what is open, and the deployment traps. Rules: push to main deploys to production; never store a Clerk
secret in Math Star; keep guest mode working; every new child-facing feminine phrase needs a masculine
entry in public/js/gender.js; run `npm test` before every push and confirm the Cloudflare check-run
(Workers Builds: math-star) succeeds after it. Start with the "Open — for Claude Code" list.
```
