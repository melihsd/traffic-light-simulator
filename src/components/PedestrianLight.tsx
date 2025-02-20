import { TrafficLightContainer, Light, BaseTrafficLightProps } from './BaseTrafficLight';
import { Button } from '@mui/material';
export enum PedestrianState {
  Red,
  Green
}

interface PedestrianLightProps extends BaseTrafficLightProps {
  state: PedestrianState;
}

export function PedestrianLight({ state, className }: PedestrianLightProps) {
  return (
    <TrafficLightContainer className={className}>
      <Light 
        $isOn={state === PedestrianState.Red}
        $color="#ff0000"
      />
      <Light 
        $isOn={state === PedestrianState.Green}
        $color="#00ff00"
      />
    </TrafficLightContainer>
  );
} 
