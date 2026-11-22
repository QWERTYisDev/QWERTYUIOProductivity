# The System: Solo Leveling style productivity RPG

React + Vite + TypeScript. Static, offline-capable PWA. No backend, no keys, no env vars.
Progress lives in this browser's `localStorage` (key `system-rpg-save`, with a `.prev` fallback copy).
**It does not sync between devices.** Use Character > System > Backup (Download / Share / Copy) to move or protect data.
If the site URL changes, the home-screen install and its data start empty: export a backup first.

## Where every file goes (iPhone friendly)

GitHub's website cannot upload folders from a phone, but it can upload many files into one folder at a time.
Unzip the ZIP in the Files app, then for each row open the link pattern in Safari
(`https://github.com/<you>/<repo>/upload/main/<folder>`; leave `<folder>` empty for the repo root),
choose all listed files, and commit.

| Repo folder | Upload URL ends with | Files |
|---|---|---|
| (root) | `/upload/main` | `package.json`, `vite.config.ts`, `tsconfig.json`, `wrangler.jsonc`, `.gitignore`, `index.html`, `README.md` |
| `public` | `/upload/main/public` | `manifest.json`, `sw.js`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` |
| `src` | `/upload/main/src` | `main.tsx`, `App.tsx`, `store.ts`, `ui.tsx`, `sound.ts`, `styles.css` |
| `src/logic` | `/upload/main/src/logic` | `types.ts`, `rand.ts`, `talents.ts`, `leveling.ts`, `character.ts`, `talentLogic.ts`, `tasks.ts`, `shop.ts`, `battle.ts`, `game.ts`, `storage.ts`, `stats.ts`, `achievements.ts` |
| `src/screens` | `/upload/main/src/screens` | `Home.tsx`, `Tasks.tsx`, `TaskRow.tsx`, `Focus.tsx`, `TalentDetail.tsx`, `Shop.tsx`, `Create.tsx`, `Character.tsx`, `Talents.tsx`, `Battle.tsx` |
| `tests` (optional) | `/upload/main/tests` | `logic.test.ts` |

`.gitignore` is a hidden file; if Files hides it, create it on GitHub with "Add file > Create new file" and paste the contents.
If your repo already holds the old app, delete the old `src`, `public`, `package.json` etc. first (or upload over them and delete leftovers).

## Deploy on Cloudflare

1. Cloudflare Dashboard > Workers & Pages.
2. Existing project `qwertyuioproductivity` already tracks your repo: pushing the files redeploys it. Check its build settings:
   Build command `npm run build`, output/assets folder `dist` (the included `wrangler.jsonc` already points at `./dist`).
   Leave the deploy command at its default.
3. New project instead: Create > Connect to Git > pick the repo > same build settings > Save and Deploy.
4. Your URL is shown on the project page (`https://<name>.<account>.workers.dev` or `.pages.dev`).
5. Updates: upload changed files to GitHub; Cloudflare rebuilds automatically (about a minute).
6. iPhone install: open the URL in Safari > Share > Add to Home Screen. Open it once online so the offline cache fills.

## Rules as implemented (so you can verify them)

- 1000 XP per level, max Level 15 (14,000 XP total, extra XP is discarded). Each level: +100 Gold, +3 Skill Points, +1 Talent Hand.
- Stats rolled 5..15 each. Health = 10 + talent health.
- Talent effective stat = (base + flat talents) x (1 + percent talents). Requirements check base stats only.
- Talent hand: up to 3 eligible talents chosen uniformly at random, saved on the character so a refresh cannot re-roll it. Empty offer can be resolved without a talent.
- Battle weights 130/115/105/100 by the opponent's effective-stat rank; 3 unique options drawn by weight; the boss picks among the 3 with the same weights.
- Battle value = (effective + battle-talent flat) x (1 + 25% matchup + battle-talent %) + random(-3..+3), rounded to 0.1. Higher wins, loser -1 HP, tie = nothing.
- Quests: daily = once per local day; weekly = chosen weekdays (optional last day); one-time = once until you press Reset. Every completion is keyed (`taskId|date` or `taskId|once`), so repeated taps, refreshes and re-renders cannot pay twice.
- Initial boss: 20/20/20/20, 10 HP, no talents, shown as Level 15.
- Win: your character becomes the boss and the old boss goes to the archive. Loss: you go to the archive, boss unchanged. Then Gen +1 and a new Level 1 character.

## Extras (cosmetic or convenience, no change to XP/level/talent/battle rules)

- **Undo:** a completed quest can be undone for 15 seconds. It reverses exactly what it paid (XP, Gems, Gold, and level-up rewards). It refuses if those rewards were already spent.
- **Streaks:** daily quests show consecutive days completed. Display only: there is no streak bonus.
- **Talents:** 100 in total, including a talent tree (some need other talents plus base stats). Each talent can be held only once, so an owned talent never shows up in a hand again. Hands favor common talents slightly (and 25 Gems "favors" a discovered talent: 4x weight until you pick it) (weights 100/70/45/28/18 for common to legendary). The catalogue shows only talents you have ever seen in a hand, across generations.
- **Achievements and titles:** 50 in Character > Titles, searchable. Cosmetic only.
- **Checklists and presets:** a quest with a checklist completes (and pays) when every item is checked. Presets fill the new-quest form.
- **Stats:** Character > Stats. Gold/Gems "earned" is derived as current balance plus everything spent.
- **Shop:** categories, favourites pinned on top, per-day limits and limited stock.
- **Backup reminder** after 14 days without a backup (snooze 3 days).
- **Focus timer:** runs only while the app is open; it completes the quest when time is up. Cancelling does not complete it.
- **Sound and haptics:** synthesized sounds, toggle under Character > System. iPhone Safari has no vibration API, so haptics use a Safari trick that works on iOS 17.4+ only.

## Checks

`npm test` runs `tests/logic.test.ts` (Node 22+): XP and multi-level-ups, cap, stat rolls, talents (100, tree reachability, requirements, hands), skill points, quest rewards and duplicates, shop, battle weights/matchups/fights/boss inheritance, backup round-trip.
`npm run typecheck` type-checks the project.

## Manual checklist on the phone

Create a character (stats reveal) > add a daily quest and tap Complete twice (reward once) > refresh (still done) > give yourself XP via quests until a level-up
(overlay, +100 Gold) > open a Talent Hand, leave the screen, come back (same 3 cards) > spend Skill Points > buy a shop item > Download/Copy a backup and Import it >
turn on airplane mode and reopen from the home screen > reach Level 15 and fight.
