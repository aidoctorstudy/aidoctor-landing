// 📖 Docs: obsidian/frontend/components/ui.md

/**
 * Checkmark — Pricing plan feature lists. Not from Figma (Pricing has no
 * source node); drawn to match `ArrowUpRightIcon`'s stroke weight so it reads
 * as part of the same icon set.
 */
import type { IconProps } from "./icon-types";

export const CheckIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    <path
      d="M13.5 4L6 11.5L2.5 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
