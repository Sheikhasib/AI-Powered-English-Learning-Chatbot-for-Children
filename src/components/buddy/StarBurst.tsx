"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const STAR_COUNT = 8;
const BURST_MS = 1000;
const RADIUS_PX = 110;

type Props = {
  /** Each increase plays one burst. */
  trigger: number;
};

/** Stars fly out from the middle for a right answer; reduced motion gets one soft fade. */
export function StarBurst({ trigger }: Props) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(0);

  useEffect(() => {
    if (trigger === 0) return;
    const start = setTimeout(() => setPlaying(trigger), 0);
    const stop = setTimeout(() => setPlaying(0), BURST_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [trigger]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      <AnimatePresence>
        {playing > 0 &&
          (reduced ? (
            <motion.div
              key={playing}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Star className="size-20 fill-accent text-accent" />
            </motion.div>
          ) : (
            Array.from({ length: STAR_COUNT }, (_, i) => {
              const angle = (i / STAR_COUNT) * Math.PI * 2;
              return (
                <motion.div
                  key={`${playing}-${i}`}
                  className="absolute"
                  initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
                  animate={{
                    x: Math.cos(angle) * RADIUS_PX,
                    y: Math.sin(angle) * RADIUS_PX,
                    scale: 1,
                    opacity: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <Star className="size-9 fill-accent text-accent" />
                </motion.div>
              );
            })
          ))}
      </AnimatePresence>
    </div>
  );
}
