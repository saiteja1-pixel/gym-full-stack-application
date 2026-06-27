import { Variants } from "framer-motion";

// ─── Framer Motion Animation Presets ────────────────────────────────────────
// Import and use these in any component for consistent animations.

/** Page-level fade + scale entrance transition */
export const pageTransition: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/** Staggered list container — wraps a list of items */
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

/** Staggered list item — each item inside listContainer */
export const listItem: Variants = {
  hidden: { opacity: 0, x: -10, scale: 0.95 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

/** Micro-interaction for buttons and cards */
export const interactiveHover = {
  whileHover: { scale: 1.02, y: -2, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};

/** Tap scaling for quick-log buttons (water, etc.) */
export const tapScaling = {
  whileHover: { scale: 1.05, boxShadow: "0 0 15px rgba(34, 211, 238, 0.4)" },
  whileTap: { scale: 0.95 },
};

/** Checklist item spring layout */
export const listItemTransition = {
  layout: { type: "spring", stiffness: 600, damping: 30 },
};

/** Slide-in from bottom (modals, drawers) */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
};

/** Fade in/out */
export const fadeInOut: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
