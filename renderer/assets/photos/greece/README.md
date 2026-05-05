# Greece — Hero Photos

Drop these JPGs in this folder and they'll auto-pick up on the next render. Until then, the renderer falls back to a soft tan placard with the page label.

## Expected filenames

| File                          | Used on                               | Suggested vibe                               |
| ----------------------------- | ------------------------------------- | -------------------------------------------- |
| `cover.jpg`                   | Cover page                            | Cyclades / Oia caldera / Aegean wide-shot    |
| `lodging-la-divina.jpg`       | Lodging page · Athens stop            | La Divina facade or Acropolis-view suite     |
| `lodging-psarou-delight.jpg`  | Lodging page · Mykonos stop           | Villa pool with sea view                     |
| `lodging-avant-mar.jpg`       | Lodging page · Paros stop             | Avant Mar pool / Piperi Beach                |
| `lodging-andronis-arcadia.jpg`| Lodging page · Santorini stop         | Cliffside suite / Oia caldera at sunset      |

## Format notes

- **JPG** preferred (~1700×1300 for cover, ~800×500 for lodging cards is plenty)
- sRGB color profile (the renderer forces `--force-color-profile=srgb`)
- Don't worry about exact aspect ratios — CSS `object-fit: cover` crops to fit
- Filenames must match exactly; the renderer references them from `data/greece.json`

## Why this folder isn't auto-populated

The dev sandbox has no outbound network, so I can't pull hotel press photos for you. Drop replacements in here at any point and re-run `bash renderer/scripts/render.sh greece` — the build script now checks for file existence and swaps the placard for the real photo automatically.
