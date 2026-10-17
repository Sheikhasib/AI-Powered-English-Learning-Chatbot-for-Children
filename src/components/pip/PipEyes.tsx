"use client";

import { useId } from "react";
import { motion } from "motion/react";
import type { ExpressionShape } from "./expressions";

const EYE_Y = 92;
const EYE_R = 26;
const EYE_XS = [72, 128] as const;

type Props = {
  shape: ExpressionShape;
  blinking: boolean;
  fadeMs: number;
};

/** Both eyes: round with a lid, or closed smiling arcs when Pip is delighted. */
export function PipEyes({ shape, blinking, fadeMs }: Props) {
  const clipBase = useId();
  const lid = blinking ? 1 : shape.lid;
  const transition = { duration: fadeMs / 1000 };

  return (
    <g>
      {EYE_XS.map((cx, i) =>
        shape.happyEyes ? (
          <path
            key={cx}
            d={`M${cx - 15} ${EYE_Y + 8} Q${cx} ${EYE_Y - 14} ${cx + 15} ${EYE_Y + 8}`}
            className="fill-none stroke-pip-eyes"
            strokeWidth={7}
            strokeLinecap="round"
          />
        ) : (
          <g key={cx}>
            <clipPath id={`${clipBase}-${i}`}>
              <circle cx={cx} cy={EYE_Y} r={EYE_R} />
            </clipPath>
            <circle cx={cx} cy={EYE_Y} r={EYE_R} className="fill-card" />
            <motion.g animate={{ x: shape.look.x, y: shape.look.y }} transition={transition}>
              <circle cx={cx} cy={EYE_Y} r={13} className="fill-pip-eyes" />
              <circle cx={cx + 4} cy={EYE_Y - 5} r={4} className="fill-card" />
            </motion.g>
            <g clipPath={`url(#${clipBase}-${i})`}>
              <motion.rect
                x={cx - EYE_R}
                y={EYE_Y - EYE_R}
                width={EYE_R * 2}
                initial={false}
                animate={{ height: lid * EYE_R * 2 }}
                transition={{ duration: blinking ? 0.08 : fadeMs / 1000 }}
                className="fill-pip-body"
              />
            </g>
          </g>
        ),
      )}
    </g>
  );
}

type BrowsProps = { shape: ExpressionShape; fadeMs: number };

/** Brows carry most of the feeling: raised and curious, or tilted and soft. */
export function PipBrows({ shape, fadeMs }: BrowsProps) {
  const transition = { duration: fadeMs / 1000 };
  const brows = [
    { cx: EYE_XS[0], brow: shape.browLeft },
    { cx: EYE_XS[1], brow: shape.browRight },
  ];
  return (
    <g>
      {brows.map(({ cx, brow }) => (
        <motion.line
          key={cx}
          x1={cx - 14}
          x2={cx + 14}
          y1={EYE_Y - 38}
          y2={EYE_Y - 38}
          strokeWidth={7}
          strokeLinecap="round"
          className="stroke-pip-eyes"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={false}
          animate={{ y: brow.y, rotate: brow.rotate }}
          transition={transition}
        />
      ))}
    </g>
  );
}
