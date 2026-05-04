# Photos

Drop trip photos here. The renderer references them by filename — no template
changes are needed when you swap in a real image, just keep the filenames.

## Expected filenames

| File                       | Used on             | Recommended size      |
| -------------------------- | ------------------- | --------------------- |
| `cover.jpg`                | Cover page          | 1700 × 1300 (or wider, will be cropped) |
| `lodging-fouquets.jpg`     | "Your Home for the Week" | 1700 × 1100      |

For multi-hotel trips, add `lodging-<slug>.jpg` for each property and duplicate
`renderer/templates/lodging.html` per hotel (e.g. `lodging-fouquets.html`,
`lodging-villa.html`) — the renderer picks up any `lodging*.html` automatically.

## Format

- **JPG** preferred (smaller files, photos compress well)
- sRGB color profile (the renderer forces `--force-color-profile=srgb`)
- Don't worry about exact aspect ratios — CSS `object-fit: cover` crops to fit

## Why this directory and not somewhere fancier

Static path = predictable. The HTML templates reference
`../assets/photos/<file>` directly, so dropping a file in is the only step.
