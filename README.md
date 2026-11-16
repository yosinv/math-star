# Math Star ⭐

Math practice web app for kids, in Hebrew — the sibling of [English Star](https://github.com/yosinv/english-star-public).

The `main` branch is the production source for Cloudflare automatic deployment.

Static files are served from `public/`; the Worker lives in `src/worker.js` and only answers `/api/*`.

## What's inside

| Page | What it does |
|---|---|
| `index.html` | **Who's playing?** profile picker, then the child's world: today's 3 missions, the skill map for her grade, practice-test entry |
| `practice.html` | Practice rounds: `?skill=<id>` (adaptive), `?mode=review` (her past mistakes), `?mode=exam` (practice test), `?hw=<id>` (homework set) |
| `games.html` | Number Rush (60 s) and Block Tower (build 10) |
| `homework.html` | Parent types the exercises from a worksheet → auto-checked practice round |
| `progress.html` | "איך הצלחתי?" table per topic, practice-test history, parent settings, backup/restore |

### Grades and skills

`public/js/engine.js` holds the skill catalog for גן → כיתה ה׳ and all problem generators.
`public/js/grade6.js` is the כיתה ו׳ track, aligned topic-by-topic with the class review booklet
(1.1 ארבע פעולות … 4.5 צורות מורכבות). Every generator produces fresh numbers, so practice
transfers to the test instead of memorising the booklet. Items that can't be auto-checked
(drawing heights, "explain why", drawing on grid paper) stay on paper.

`public/js/grade4.js` is the כיתה ד׳ track, aligned with the class test notice's 13 topics
(1 מספרים עד 1,000,000 … 13 אלכסונים, צלעות מקבילות וסמוכות).

### Test prep page

`test.html` ("הכנה למבחן") lists the child's grade topics with a status for each (שולטת / כמעט /
צריכה עוד תרגול), suggests what to practise today, and links to a practice test that covers every
topic in order. The test date is saved per child; open `test.html?date=YYYY-MM-DD` on that child's
profile to set it in one tap, and the child's world shows a countdown until the day.

### Boys and girls

Each profile is בן or בת (profiles saved before this setting are בת). Text is written in the
feminine form and `public/js/gender.js` rewrites the second-person forms for a boy from an
explicit word list (never a suffix rule — "חלקי" is also "over" in "3 חלקי 4"). Screens shared by
several children (who's playing, new profile) use the neutral plural. Word-problem characters are
boys and girls, and their verbs agree with the character (`person()` in `engine.js`).

### Adaptivity

- 4 correct in a row (first try) → star + next level (1 → 2 → 3)
- 2 misses in a row → one level easier
- Anything not right on the first try goes into the review queue and comes back later
- XP: +10 first try, +5 second try · level every 120 XP · gems per round · daily streak — same model as English Star

## Accounts and storage — same model as English Star

Math Star shares English Star's accounts:

- **Parent sign-in** with English Star's Clerk app (same email/password or Google).
- **Family and children** are the rows in English Star's D1 database (`families`, `children`) —
  the same kids, names and characters on both sites. A child added on Math Star appears on English Star.
- **Parent PIN** — the same 4-digit PIN (`parent_pins`), set on English Star's "My Family" page,
  protects adding a child, renaming, and changing boy/girl or grade on Math Star.
- **Math progress** is saved per child in `math_child_state` (one JSON document per child),
  created by the Worker on first use. Deleting a child on English Star removes it too.

Without sign-in nothing changes: profiles and progress stay on the device (`localStorage`,
key `mathstar.v1`). The first time a parent signs in on a device that has progress, Math Star
offers to move it into the family account (matching kids by name, or adding them), then keeps a
dated copy on the device and clears it.

Saving: after every answer, the child's progress is saved (retried if offline); tapping a link
waits for the save to finish; closing the page sends a last save.

### API (all need a signed-in parent)

| Route | |
|---|---|
| `GET /api/math/me` | family's children with boy/girl and math grade |
| `GET/PUT /api/math/children/:id/state` | load / save a child's math progress |
| `PATCH /api/math/children/:id/settings` | boy/girl, grade — first time free, later needs the PIN |
| `POST /api/math/children` · `PATCH /api/math/children/:id` | add / rename a child — parent PIN |
| `GET /api/parent-pin` · `POST /api/parent-pin/unlock` · `/lock` | same PIN as English Star |

### Kid phones and pictures

A parent makes a code on English Star's Family page ("📱 Connect a phone"); the child types it at
`/join.html`. The phone then acts as that one child (HttpOnly cookie `ms_kid`, device row in English
Star's `kid_devices`, so English Star's Family page can disconnect it). Children's character pictures
(`char:<id>` on English Star) are copied in `public/assets/chars/`. Privacy page: `public/privacy.html`.

### Configuration

`wrangler.jsonc` binds English Star's D1 database, holds the publishable key of English Star's
**production** Clerk app, and `CLERK_FAPI_URL` (`https://clerk.englishstarkids.com`). The Worker reads
Clerk's **public** keys from `CLERK_FAPI_URL/.well-known/jwks.json` (cached for an hour, refetched when
a token names a new key) and accepts only tokens issued by that URL. So **no Clerk secret key is
stored on Math Star** (English Star keeps the admin secret), and a Clerk key rotation needs no change.
`CLERK_JWT_KEY` (a pasted PEM public key) still overrides the fetch if ever needed.

Production Clerk only runs on `englishstarkids.com` and its subdomains, so Math Star is served at
**https://math.englishstarkids.com** (Workers custom domain, in `wrangler.jsonc` `routes`). The old
`math-star.yosinv.workers.dev` keeps working on the device only and shows a "move with your progress"
button that carries device progress over in the link (`public/js/move.js`).

## Develop

```sh
npm install
npm test        # engine tests: fuzzes every skill/level and cross-checks answers with an independent evaluator
npm run dev     # sign-in works locally only with real Clerk tokens; guest mode works without them
```

## Deploy

Cloudflare dashboard → Workers & Pages → Create → Import a repository → this repo, branch `main`.
Build command: none. Deploy command: `npx wrangler deploy`.
