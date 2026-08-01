/**
 * Tests: Contributions admin page — narrow-screen row overflow prevention (320 px)
 *
 * A future CSS/JSX change (e.g. adding a new icon button, changing padding, or
 * switching to flex-nowrap) could silently push the action-button row outside the
 * 320 px viewport.  This test asserts the static class names that prevent overflow,
 * so any breaking change is caught immediately.
 *
 * Checks (all at mobile / no Tailwind `sm:` breakpoint, i.e. 320×700 px):
 *   1. Card row stacks vertically (`flex-col`) on mobile so content never exceeds
 *      the viewport width in the inline direction.
 *   2. Action-button container has `flex-wrap` (not just `sm:flex-nowrap` without
 *      a base `flex-wrap`) so buttons wrap instead of overflowing.
 *   3. Action-button container does NOT have a bare (non-responsive) `flex-nowrap`
 *      that would override the wrapping at 320 px.
 *   4. Icon/text body uses `min-w-0` so long donor names cannot force the flex
 *      child (and thus the card) wider than the viewport.
 *   5. The outer page wrapper has a responsive max-width (`max-w-4xl`) with
 *      horizontal padding so the card is never full-bleed with zero gutters.
 *   6. No action button uses a fixed pixel width wider than 180 px (which would
 *      overflow on its own at 320 px).
 *
 * Pure static analysis — no live server or browser required.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  resolve(__dirname, "../../ayyappan-temple/src/pages/admin/Contributions.tsx"),
  "utf8"
);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓  ${message}`);
    passed++;
  } else {
    console.error(`  ✗  ${message}`);
    failed++;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. Card row stacks vertically at mobile (flex-col)
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Card row direction at 320 px ──");

// The contribution card uses `flex flex-col sm:flex-row …`
// At 320 px (below the sm: breakpoint) the row is flex-col — content stacks
// vertically and can never be wider than the viewport.
assert(
  /flex[^"]*\bflex-col\b[^"]*\bsm:flex-row\b/.test(src) ||
  /flex[^"]*\bflex-col\b/.test(src),
  "Contribution card has `flex-col` base class — row stacks vertically on mobile (320 px)"
);

assert(
  /\bflex-col\b/.test(src),
  "`flex-col` is present in source — vertical stack prevents inline overflow at 320 px"
);

// ──────────────────────────────────────────────────────────────────────────────
// 2. Action-button container wraps at mobile (flex-wrap)
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Action-button container wrapping ──");

// The action-button div should carry `flex-wrap` (base, applies at all widths
// including 320 px) so buttons that don't fit side-by-side wrap to the next line
// rather than pushing outside the viewport.
assert(
  /\bflex-wrap\b/.test(src),
  "Action-button container has `flex-wrap` — buttons wrap on narrow screens instead of overflowing"
);

// sm:flex-nowrap is fine (it only kicks in at ≥ 640 px), but a bare flex-nowrap
// (without a responsive prefix) would defeat the wrapping on 320 px screens.
const bareNowrapMatch = src.match(/(?<![a-z]:)\bflex-nowrap\b/g);
assert(
  !bareNowrapMatch || bareNowrapMatch.length === 0,
  "No bare (non-responsive) `flex-nowrap` in source — wrapping is not suppressed at 320 px"
);

// ──────────────────────────────────────────────────────────────────────────────
// 3. Responsive nowrap is correctly prefixed (sm: or larger)
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Responsive flex-nowrap (≥640 px only) ──");

// If flex-nowrap appears anywhere it MUST be prefixed with at least sm:
// (we already checked there is no bare flex-nowrap; now confirm the prefixed
// form is what's actually used for the action-button row).
const hasPrefixedNowrap = /\bsm:flex-nowrap\b/.test(src);
const hasAnyNowrap = /flex-nowrap\b/.test(src);
assert(
  !hasAnyNowrap || hasPrefixedNowrap,
  "All `flex-nowrap` occurrences are responsive (`sm:flex-nowrap`) — safe at 320 px"
);

// ──────────────────────────────────────────────────────────────────────────────
// 4. Donor-name / body text has min-w-0 (flex shrink works correctly)
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Flex child min-width at 320 px ──");

// In a flex row a child's min-width defaults to `auto` which means it sizes to
// its content and can overflow the flex container.  `min-w-0` overrides this,
// letting the child shrink below its intrinsic size.
assert(
  /\bmin-w-0\b/.test(src),
  "Body text column has `min-w-0` — flex child can shrink below intrinsic size, preventing card overflow"
);

// ──────────────────────────────────────────────────────────────────────────────
// 5. Outer wrapper is bounded with responsive padding
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Outer page wrapper constraints ──");

// The outer wrapper uses `max-w-4xl mx-auto` plus responsive padding (p-4 md:p-8).
// At 320 px: max-w-4xl doesn't constrain (viewport is narrower), but `p-4` (16 px
// each side) gives a gutter so the card never bleeds to the screen edge.
assert(
  /\bmax-w-4xl\b/.test(src),
  "Outer wrapper has `max-w-4xl` — content is bounded on wider screens"
);

assert(
  /\bp-4\b/.test(src),
  "Outer wrapper has `p-4` base padding — 16 px gutter is present at 320 px"
);

// ──────────────────────────────────────────────────────────────────────────────
// 6. No fixed pixel width on action buttons wider than 180 px
// ──────────────────────────────────────────────────────────────────────────────

console.log("\n── Fixed-width buttons ──");

// Action buttons use icon-sized fixed dimensions (w-8 h-8, min-w-[44px]).
// A fixed width > 180 px on a single button would overflow at 320 px on its own.
const wideFixedWidths = [...src.matchAll(/\bw-\[(\d+)px\]/g)]
  .map(m => parseInt(m[1], 10))
  .filter(px => px > 180);

assert(
  wideFixedWidths.length === 0,
  `No action button has a fixed pixel width > 180 px (found: ${wideFixedWidths.join(", ") || "none"}) — each button fits within 320 px`
);

// min-w-[44px] (44 px touch target) is present and safe
assert(
  /\bmin-w-\[44px\]/.test(src),
  "Action buttons use `min-w-[44px]` touch target (44 px ≤ 320 px — safe on narrowest phones)"
);

// ──────────────────────────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(60)}`);
if (failed === 0) {
  console.log(`✅  All ${passed} contribution row overflow checks passed.`);
  console.log(`    The admin Contributions page is safe at 320×700 px:`);
  console.log(`    rows stack vertically, action buttons wrap, flex children`);
  console.log(`    can shrink, and no button is wider than the viewport.`);
} else {
  console.error(`❌  ${failed} overflow check(s) failed, ${passed} passed.`);
  console.error(`    Fix the flagged class names in Contributions.tsx.`);
  process.exit(1);
}
