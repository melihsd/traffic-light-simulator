import { LightState } from "@/components/TrafficLight";
import { PedestrianState } from "@/components/PedestrianLight";
import { IntersectionPhase } from "../config/phases";

export interface IntersectionState {
  mainRoad: LightState;
  sideRoad: LightState;
  pedestrian: PedestrianState;
  pedestrianRequest: boolean;
  isRunning: boolean;
  currentPhase: IntersectionPhase;
  statusText: string;
}

export type IntersectionStateCallback = (state: IntersectionState) => void;
