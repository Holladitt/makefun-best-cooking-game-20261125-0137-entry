# Make the best cooking game

Entry for the make.fun bounty [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137) — a complete original cooking game for desktop browser, judged pairwise by screenshots and source outline.

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Holladitt/makefun-best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Holladitt/makefun-best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

## Entry

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library. The game is a complete original 2D canvas cooking game: kitchen, order board, ingredients on the counter, dishes mid-assembly, timer, plates ready to serve — played with keyboard and mouse, static files, no network.

## Run

```sh
node serve.ts
# open http://localhost:8080 and play
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
