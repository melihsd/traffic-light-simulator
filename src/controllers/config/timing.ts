import { ITimingConfig } from "../interfaces/ILight";

export const TIMING = {
  BLINK_INTERVAL: 500,
  DEFAULT: {
    green: 5000, // 5 seconds
    yellow: 1000, // 1 second
    red: 2000, // 2 seconds
    redYellow: 2000, // 2 seconds
    transition: 1000, // 1 second
  },
  MAIN_ROAD: {
    green: 5000, // 5 seconds
    yellow: 1000, // 1 second
    red: 2000, // 2 seconds
    redYellow: 2000, // 2 seconds
    transition: 1000, // 1 second
  },
  PEDESTRIAN: {
    green: 5000, // 5 seconds
    transition: 1000, // 1 second
  },
} as const;

// Derived timings
export const PHASE_TIMINGS = {
  yellowToRed: TIMING.DEFAULT.yellow + TIMING.DEFAULT.red,
  redToGreen: TIMING.DEFAULT.redYellow,
  fullTransition: TIMING.DEFAULT.transition,
} as const;
