"use client";

import { animate, motion, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

export function CountUp({
  to,
  duration = 1.4,
  className,
}: {
  to: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  // Always start at 0, never `reduce ? to : 0`.
  //
  // useReducedMotion() returns null during SSR but reads matchMedia
  // synchronously on the client, so branching on it *during render* makes the
  // first client render disagree with the server for anyone who has
  // "reduce motion" enabled — the server emits 0, their browser emits `to`,
  // and React discards the tree. Honour the preference in the effect below
  // instead, where it costs one frame and no mismatch.
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    // Always drive the value through animate(), collapsing the duration to 0
    // for reduced motion rather than calling mv.set(). A bare set() does not
    // reliably propagate to the rendered text on framer-motion 12.42 / React
    // 18 — the score renders as 0 forever — whereas the animation pipeline
    // updates the DOM on both that stack and React 19.
    const controls = animate(mv, to, {
      duration: reduce ? 0 : duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [to, duration, mv, reduce]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
