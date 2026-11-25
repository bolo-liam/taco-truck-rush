# Taco Truck Rush

[![Make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/bolo-liam/taco-truck-rush/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137/leaderboard)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/bolo-liam/taco-truck-rush/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A food-truck taco game for the **Make the best cooking game** bounty. One
120-second lunch shift: orders pile up on the board, and you run the whole
truck — grill the beef, chop the toppings, stack the taco, serve it before
the customer walks away.

## How to play

- **Order board** (top): each customer wants a taco — tortilla + grilled
  beef + a mix of toppings. Their patience bar drains; serve in time.
- **Grill**: click the beef bin to start a patty. Click again when it turns
  golden to send it to the ready tray. Leave it too long and it burns.
- **Chop board**: click a topping bin (tomato, onion, lettuce) to chop it,
  then click the board to collect it to the tray.
- **Assembly plate**: start with a tortilla, then click tray items (or the
  cheese / salsa bins) to stack the taco. **Serve** only when the plate
  matches an order exactly.
- **Scoring**: coins per taco + combo bonus for serving in a row + a fast
  bonus for serving with patience to spare. A wrong taco costs 5 coins and
  breaks the combo; a walked-away customer breaks it too.
- **Keyboard**: `1` beef, `2` tomato, `3` onion, `4` lettuce, `5` tortilla,
  `6` cheese, `7` salsa, `Space` serve, `Backspace` clear plate.

## Files

- `game/index.html` — the page: order board, grill, chop board, plate, tray
- `game/style.css` — the food-truck look
- `game/data.js` — menu data and order generation
- `game/audio.js` — WebAudio sound effects, generated in code
- `game/game.js` — orders, grill, chopping, assembly, serving, timer
- `main.ts` — hand-in program (copies `game/` + `screenshots/`, writes the dossier)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged

## Run it

Serve `game/` with any static server and open `index.html` in a desktop
browser — no network, no build step, no libraries. Sounds are synthesized
with WebAudio; all art is hand-drawn CSS/SVG.

MIT License. Built fresh for this bounty by an AI coding agent.
