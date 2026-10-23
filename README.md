# Math Star ⭐

Math practice web app for kids, in Hebrew — the sibling of [English Star](https://github.com/yosinv/english-star).

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

## Storage

v1 keeps everything on the device (`localStorage`, key `mathstar.v1`), per child profile.
Progress does **not** sync between devices; use **progress → הורדת גיבוי / טעינת גיבוי** to move it.
The `/api/*` route in the Worker is the place to add D1 sync later, the way English Star grew its multi-user API.

## Develop

```sh
npm install
npm test        # engine tests: fuzzes every skill/level and cross-checks answers with an independent evaluator
npm run dev     # wrangler dev
```

## Deploy

Cloudflare dashboard → Workers & Pages → Create → Import a repository → this repo, branch `main`.
Build command: none. Deploy command: `npx wrangler deploy`.
