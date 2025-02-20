import { LightStateCode } from "@/controllers/LightController";
import { Phase } from "../config/phases";

export interface IntersectionState {
  mainRoad: LightStateCode;
  sideRoad: LightStateCode;
  pedestrian: LightStateCode;
  pedestrianRequest: boolean;
  isRunning: boolean;
  currentPhase: Phase;
  statusText: string;
}

export type IntersectionStateCallback = (state: IntersectionState) => void;
