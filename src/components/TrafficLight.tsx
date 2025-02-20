import { TrafficLightContainer, Light, BaseTrafficLightProps } from './BaseTrafficLight';

export enum LightState {
  Red,
  RedYellow,
  Yellow,
  Green
}

interface TrafficLightProps extends BaseTrafficLightProps {
  state: LightState;
}

export function TrafficLight({ state, className }: TrafficLightProps) {
  return (
    <TrafficLightContainer className={className}>
      <Light 
        $isOn={state === LightState.Red || state === LightState.RedYellow}
        $color="#ff0000"
      />
      <Light 
        $isOn={state === LightState.Yellow || state === LightState.RedYellow}
        $color="#ffff00"
      />
      <Light 
        $isOn={state === LightState.Green}
        $color="#00ff00"
      />
    </TrafficLightContainer>
  );
}
