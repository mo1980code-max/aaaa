# Baby Care World — عالم رعاية الأطفال

A browser-based Arabic baby-care game built with Phaser 3. The game is served as static files; the two original character illustrations are loaded from `public/assets/characters/`.

## Run locally

From the repository root, start any static web server. For example:

```sh
python3 -m http.server 8080 --bind 0.0.0.0
```

Then open `http://localhost:8080`. Phaser is loaded from jsDelivr, so an internet connection is required on first load.

## Gameplay

- Choose Adam or Layan, then explore six rooms.
- Care for hunger, hygiene, sleep, energy, and happiness.
- Complete care activities to earn coins; use the care shop for quick boosts.
- Earn stars when your baby's overall mood reaches “سعيد جداً”.
- Game progress and settings are saved in the browser's local storage.

The game is designed for a 16:9 landscape screen and scales to fit the browser window.
