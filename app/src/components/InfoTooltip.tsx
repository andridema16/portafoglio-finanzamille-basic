"use client";

import { useState, useRef, useEffect, useId, useCallback } from "react";

/**
 * Icona info (i) con tooltip al hover che spiega come viene calcolato un dato.
 */
export default function InfoTooltip({ testo }: { testo: string }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [posizione, setPosizione] = useState<"bottom" | "top">("bottom");
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const id = useId();

  const visibile = hovered || focused;

  useEffect(() => {
    if (visibile && iconRef.current && tooltipRef.current) {
      requestAnimationFrame(() => {
        if (!iconRef.current || !tooltipRef.current) return;
        const iconRect = iconRef.current.getBoundingClientRect();
        const tooltipHeight = tooltipRef.current.offsetHeight;
        if (iconRect.bottom + tooltipHeight + 8 > window.innerHeight) {
          setPosizione("top");
        } else {
          setPosizione("bottom");
        }
      });
    }
  }, [visibile]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setFocused(false);
      setHovered(false);
    }
  }, []);

  return (
    <span className="relative inline-flex" ref={iconRef}>
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] font-bold leading-none flex items-center justify-center hover:bg-gray-400 transition-colors cursor-help"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        aria-label="Informazioni sul calcolo"
        aria-describedby={visibile ? id : undefined}
      >
        i
      </button>
      {visibile && (
        <div
          ref={tooltipRef}
          id={id}
          className={`absolute z-50 w-56 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg whitespace-pre-line ${
            posizione === "bottom"
              ? "top-full mt-1.5 left-1/2 -translate-x-1/2"
              : "bottom-full mb-1.5 left-1/2 -translate-x-1/2"
          }`}
          role="tooltip"
        >
          {testo}
        </div>
      )}
    </span>
  );
}
