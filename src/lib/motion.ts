import type { Variants, Transition } from "framer-motion";

export const spring: Transition = { type: "spring", stiffness: 320, damping: 28, mass: 0.9 };
export const springSoft: Transition = { type: "spring", stiffness: 180, damping: 26 };
export const ease: Transition = { duration: 0.24, ease: [0.22, 1, 0.36, 1] };
export const easeLong: Transition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: ease },
};

export const staggerParent = (delayChildren = 0.05, staggerChildren = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren, staggerChildren },
  },
});

export const cardHover = {
  rest: { y: 0, scale: 1, transition: spring },
  hover: { y: -3, scale: 1.005, transition: spring },
};

export const pressable = {
  rest: { scale: 1 },
  hover: { scale: 1.01 },
  tap: { scale: 0.985 },
};
