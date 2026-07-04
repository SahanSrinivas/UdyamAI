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
  const mv = useMotionValue(reduce ? to : 0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());

  useEffect(() => {
    if (reduce) {
      mv.set(to);
      return;
    }
    const controls = animate(mv, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [to, duration, mv, reduce]);

  return <motion.span className={className}>{rounded}</motion.span>;
}
