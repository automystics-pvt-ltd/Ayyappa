---
name: Tamil badge label overflow
description: Why long Tamil words overflow fixed-width badges and how to prevent it.
---

## Rule
Before placing Tamil text inside a fixed-width badge/pill, verify the rendered width of the longest word fits within the container. Tamil words have no internal break points (no spaces), so `word-break: normal` + `overflow-wrap: normal` will never wrap a single Tamil word — it overflows the container unchanged.

## Why
Tamil script characters are wider than Latin characters at the same font size. A 13-character Tamil word like "நன்கொடையாளர்" renders ~78px at `font-size: 8px`, but a `w-14` Tailwind container is only 56px. The word spills out and overlaps adjacent content with no visual clue.

## How to apply
- Either shorten the label to a word that fits (e.g. "நன்கொடை" ≈ 48px at 8px), or
- Widen the badge container enough to contain the full word, or
- Add `overflow-hidden` + `truncate` to clip overflow with an ellipsis.
- Do not rely on `text-center` or `leading-tight` alone — they do not prevent overflow.

## Where this was applied
`SerialBadge` and `IKSerialBadge` in `artifacts/ayyappan-temple/src/components/sections/DonorWall.tsx` — label changed from "நன்கொடையாளர்" to "நன்கொடை".
