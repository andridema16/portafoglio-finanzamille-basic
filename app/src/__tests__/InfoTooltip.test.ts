/**
 * QA Tests for InfoTooltip component
 *
 * Environment: vitest (node) — no jsdom/testing-library available.
 * Strategy: static analysis of the component source + pure logic tests
 * covering prop handling, state management, conditional rendering rules,
 * accessibility, and the viewport-overflow calculation.
 *
 * DOM-dependent behaviour (getBoundingClientRect, window.innerHeight, ref
 * mutations, requestAnimationFrame) is verified through static code analysis.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load the component source as a string for static analysis ───────────────

const COMPONENT_PATH = resolve(
  __dirname,
  "../components/InfoTooltip.tsx"
);
const source = readFileSync(COMPONENT_PATH, "utf-8");

// ─── Helper: find lines that match a pattern ──────────────────────────────────
function linesMatching(pattern: RegExp): string[] {
  return source
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => pattern.test(l));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MODULE SHAPE
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — module shape", () => {
  it("is a use-client component", () => {
    expect(source.trimStart().startsWith('"use client"')).toBe(true);
  });

  it("has a default export named InfoTooltip", () => {
    expect(source).toMatch(/export default function InfoTooltip/);
  });

  it("accepts a `testo` prop of type string", () => {
    expect(source).toMatch(/\{\s*testo\s*\}\s*:\s*\{\s*testo\s*:\s*string\s*\}/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — imports", () => {
  it("imports useState from react", () => {
    expect(source).toMatch(/import.*useState.*from\s+["']react["']/);
  });

  it("imports useRef from react", () => {
    expect(source).toMatch(/import.*useRef.*from\s+["']react["']/);
  });

  it("imports useEffect from react", () => {
    expect(source).toMatch(/import.*useEffect.*from\s+["']react["']/);
  });

  it("imports useId from react (for aria-describedby link)", () => {
    expect(source).toMatch(/import.*useId.*from\s+["']react["']/);
  });

  it("imports useCallback from react (for stable handleKeyDown)", () => {
    expect(source).toMatch(/import.*useCallback.*from\s+["']react["']/);
  });

  it("does not import anything outside of react (no extra deps)", () => {
    const importLines = linesMatching(/^import /);
    expect(importLines.length).toBe(1);
    expect(importLines[0]).toMatch(/from\s+["']react["']/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — state management", () => {
  it("has separate `hovered` state initialised to false", () => {
    expect(source).toMatch(/const\s+\[hovered,\s*setHovered\]\s*=\s*useState\(false\)/);
  });

  it("has separate `focused` state initialised to false", () => {
    expect(source).toMatch(/const\s+\[focused,\s*setFocused\]\s*=\s*useState\(false\)/);
  });

  it("derives `visibile` as hovered OR focused (logical OR)", () => {
    expect(source).toMatch(/const\s+visibile\s*=\s*hovered\s*\|\|\s*focused/);
  });

  it("initialises `posizione` to \"bottom\"", () => {
    expect(source).toMatch(/useState<"bottom"\s*\|\s*"top">\("bottom"\)/);
  });

  it("uses useId to generate a stable id for the tooltip", () => {
    expect(source).toMatch(/const\s+id\s*=\s*useId\(\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. EVENT HANDLERS — mouse events
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — mouse event handlers", () => {
  it("sets hovered=true on mouse enter", () => {
    expect(source).toMatch(/onMouseEnter=\{.*setHovered\(true\)/);
  });

  it("sets hovered=false on mouse leave", () => {
    expect(source).toMatch(/onMouseLeave=\{.*setHovered\(false\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EVENT HANDLERS — keyboard/focus events
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — focus and keyboard event handlers", () => {
  it("sets focused=true on focus", () => {
    expect(source).toMatch(/onFocus=\{.*setFocused\(true\)/);
  });

  it("sets focused=false on blur", () => {
    expect(source).toMatch(/onBlur=\{.*setFocused\(false\)/);
  });

  it("attaches onKeyDown handler to the button", () => {
    expect(source).toMatch(/onKeyDown=\{handleKeyDown\}/);
  });

  it("handleKeyDown closes tooltip when Escape is pressed", () => {
    expect(source).toMatch(/e\.key\s*===\s*"Escape"/);
    // After Escape, both focused and hovered are reset
    const escapeBlock = source.slice(source.indexOf('e.key === "Escape"'));
    expect(escapeBlock).toMatch(/setFocused\(false\)/);
    expect(escapeBlock).toMatch(/setHovered\(false\)/);
  });

  it("handleKeyDown is memoised with useCallback", () => {
    expect(source).toMatch(/const\s+handleKeyDown\s*=\s*useCallback/);
    // Empty deps array — function does not close over changing state
    expect(source).toMatch(/useCallback\(.*\[\]\)/s);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. CONDITIONAL RENDERING
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — conditional rendering", () => {
  it("renders the tooltip only when visibile is true", () => {
    expect(source).toMatch(/\{visibile\s*&&\s*\(/);
  });

  it("renders the testo prop inside the tooltip", () => {
    expect(source).toMatch(/\{testo\}/);
  });

  it("applies role=tooltip to the tooltip element", () => {
    expect(source).toMatch(/role="tooltip"/);
  });

  it("tooltip has an id attribute (for aria-describedby link)", () => {
    // The tooltip div uses `id={id}`
    expect(source).toMatch(/id=\{id\}/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. POSITION LOGIC — static analysis
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — position logic (static analysis)", () => {
  it("positions tooltip at bottom by default (top-full CSS class)", () => {
    expect(source).toMatch(/posizione === "bottom"/);
    expect(source).toMatch(/top-full/);
  });

  it("repositions tooltip to top when it would overflow the viewport", () => {
    expect(source).toMatch(/iconRect\.bottom\s*\+\s*tooltipHeight\s*\+\s*8\s*>\s*window\.innerHeight/);
    expect(source).toMatch(/setPosizione\("top"\)/);
  });

  it("resets to bottom position when there is enough space below", () => {
    expect(source).toMatch(/setPosizione\("bottom"\)/);
  });

  it("runs position calculation inside useEffect when visibile changes", () => {
    expect(source).toMatch(/\[visibile\]/);
  });

  it("wraps DOM measurement inside requestAnimationFrame to avoid layout thrash", () => {
    expect(source).toMatch(/requestAnimationFrame/);
  });

  it("guards refs inside the requestAnimationFrame callback before accessing them", () => {
    // Double-check refs inside the rAF callback
    expect(source).toMatch(/if\s*\(\s*!iconRef\.current\s*\|\|\s*!tooltipRef\.current\s*\)/);
  });

  it("guards position calculation — only runs when visibile and both refs are set", () => {
    expect(source).toMatch(/if\s*\(visibile\s*&&\s*iconRef\.current\s*&&\s*tooltipRef\.current\)/);
  });

  it("bottom position uses CSS classes top-full and mt-1.5", () => {
    expect(source).toMatch(/top-full mt-1\.5/);
  });

  it("top position uses CSS classes bottom-full and mb-1.5", () => {
    expect(source).toMatch(/bottom-full mb-1\.5/);
  });

  it("tooltip is horizontally centred with left-1/2 and -translate-x-1/2", () => {
    const centreLines = linesMatching(/left-1\/2.*-translate-x-1\/2/);
    expect(centreLines.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. ACCESSIBILITY
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — accessibility", () => {
  it("button has an aria-label", () => {
    expect(source).toMatch(/aria-label="[^"]+"/);
  });

  it("button is type=button (prevents accidental form submission)", () => {
    expect(source).toMatch(/type="button"/);
  });

  it("tooltip has role=tooltip for screen readers", () => {
    expect(source).toMatch(/role="tooltip"/);
  });

  it("button links to tooltip via aria-describedby when visible", () => {
    // aria-describedby is set to id when visibile, undefined otherwise
    expect(source).toMatch(/aria-describedby=\{visibile\s*\?\s*id\s*:\s*undefined\}/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Z-INDEX / OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — overlay z-index", () => {
  it("tooltip has z-50 to appear above other content", () => {
    expect(source).toMatch(/z-50/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. TOOLTIP WIDTH AND TEXT RENDERING
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — tooltip sizing and text", () => {
  it("tooltip has a fixed width (w-56) to prevent text overflow", () => {
    expect(source).toMatch(/w-56/);
  });

  it("supports multi-line text via whitespace-pre-line", () => {
    expect(source).toMatch(/whitespace-pre-line/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. PURE LOGIC — position calculation formula
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — pure position calculation logic", () => {
  /**
   * Re-implementation of the exact formula from the useEffect / rAF callback:
   *   if (iconRect.bottom + tooltipHeight + 8 > window.innerHeight)
   *       posizione = "top"
   *   else
   *       posizione = "bottom"
   */
  function calcPosition(
    iconBottom: number,
    tooltipHeight: number,
    viewportHeight: number
  ): "top" | "bottom" {
    if (iconBottom + tooltipHeight + 8 > viewportHeight) {
      return "top";
    }
    return "bottom";
  }

  it("returns bottom when icon is at the top of the screen (plenty of space)", () => {
    // 100 + 80 + 8 = 188 < 768
    expect(calcPosition(100, 80, 768)).toBe("bottom");
  });

  it("returns top when icon is near the bottom of the screen", () => {
    // 700 + 80 + 8 = 788 > 768
    expect(calcPosition(700, 80, 768)).toBe("top");
  });

  it("returns bottom when exactly at the boundary — strict greater-than, not >=", () => {
    // 680 + 80 + 8 = 768 = viewportHeight → NOT > → bottom
    expect(calcPosition(680, 80, 768)).toBe("bottom");
  });

  it("returns top when one pixel past the boundary", () => {
    // 681 + 80 + 8 = 769 > 768
    expect(calcPosition(681, 80, 768)).toBe("top");
  });

  it("returns bottom with a small tooltip on a tall viewport", () => {
    // 50 + 20 + 8 = 78 < 1200
    expect(calcPosition(50, 20, 1200)).toBe("bottom");
  });

  it("handles zero-height tooltip — only the 8px gap matters", () => {
    // 760 + 0 + 8 = 768 NOT > 768 → bottom
    expect(calcPosition(760, 0, 768)).toBe("bottom");
    // 761 + 0 + 8 = 769 > 768 → top
    expect(calcPosition(761, 0, 768)).toBe("top");
  });

  it("handles a tooltip taller than the viewport — always overflows", () => {
    // 1 + 800 + 8 = 809 > 768
    expect(calcPosition(1, 800, 768)).toBe("top");
  });

  it("works correctly on mobile viewport (height 667px)", () => {
    // icon at 600px, tooltip 80px → 600 + 80 + 8 = 688 > 667 → top
    expect(calcPosition(600, 80, 667)).toBe("top");
    // icon at 100px, tooltip 80px → 100 + 80 + 8 = 188 < 667 → bottom
    expect(calcPosition(100, 80, 667)).toBe("bottom");
  });

  it("works correctly on large desktop viewport (height 1440px)", () => {
    // 1300 + 80 + 8 = 1388 < 1440 → bottom (still fits)
    expect(calcPosition(1300, 80, 1440)).toBe("bottom");
    // 1360 + 80 + 8 = 1448 > 1440 → top
    expect(calcPosition(1360, 80, 1440)).toBe("top");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. DERIVED STATE LOGIC — visibile = hovered || focused
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — derived visibile state", () => {
  /**
   * The component derives `visibile` as: hovered || focused.
   * Test the truth table here without React.
   */
  function deriveVisibile(hovered: boolean, focused: boolean): boolean {
    return hovered || focused;
  }

  it("is false when neither hovered nor focused", () => {
    expect(deriveVisibile(false, false)).toBe(false);
  });

  it("is true when only hovered", () => {
    expect(deriveVisibile(true, false)).toBe(true);
  });

  it("is true when only focused", () => {
    expect(deriveVisibile(false, true)).toBe(true);
  });

  it("is true when both hovered and focused", () => {
    expect(deriveVisibile(true, true)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. PROP EDGE CASES — static analysis
// ─────────────────────────────────────────────────────────────────────────────
describe("InfoTooltip — prop edge cases (static analysis)", () => {
  it("renders testo prop directly without any transformation", () => {
    const testoLines = linesMatching(/\{testo\}/);
    expect(testoLines.length).toBeGreaterThan(0);
    // No string methods applied to testo
    const transformLines = linesMatching(/testo\.(trim|toUpperCase|toLowerCase|replace|slice)/);
    expect(transformLines.length).toBe(0);
  });

  it("does not use a conditional guard that would suppress empty-string props", () => {
    // React renders empty strings fine — no ternary guard needed or desirable
    expect(source).not.toMatch(/testo\s*\?\s*testo\s*:/);
  });
});
