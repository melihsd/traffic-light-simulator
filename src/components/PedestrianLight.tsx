import {
  TrafficLightContainer,
  Light,
  BaseTrafficLightProps,
} from "./BaseTrafficLight";
import { Button } from "@mui/material";
export enum PedestrianState {
  Off,
  Red,
  Green,
}

interface PedestrianLightProps {
  state: PedestrianState;
  className?: string;
}

export function PedestrianLight({ state, className }: PedestrianLightProps) {
  return (
    <TrafficLightContainer className={className}>
      <Light $isOn={state === PedestrianState.Red} $color="#ff0000" />
      <Light $isOn={state === PedestrianState.Green} $color="#00ff00" />
    </TrafficLightContainer>
  );
}
