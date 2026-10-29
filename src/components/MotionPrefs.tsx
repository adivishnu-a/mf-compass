"use client";
import { MotionConfig } from "motion/react";

/** Honour the system's reduced-motion setting in every Motion animation: movement is dropped, fades stay. */
export function MotionPrefs({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
