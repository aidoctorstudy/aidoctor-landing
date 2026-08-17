// 📖 Docs: obsidian/frontend/components/ui.md

/**
 * Diagonal arrow — extracted from the Figma frame (node `1546:262` / the glyph
 * inside `1572:537`). The mockup ships it baked onto a lime disc; the disc is a
 * token-coloured element in markup, so only the arrow lives here.
 */
import type { IconProps } from "./dna-icon";

export const ArrowUpRightIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 19.0049 19"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path
      d="M19.0049 1.18457H19.002V18.3564H17.8047V2.21973L0.84668 19L0 18.1621L17.1582 1.18457H0.453125V0H19.0049V1.18457Z"
      fill="currentColor"
    />
  </svg>
);
