export enum LightState {
  Red,
  RedYellow,
  Yellow,
  Green
}

interface TrafficLightProps {
  state: LightState;
}

export function TrafficLight({ state }: TrafficLightProps) {
  return (
    <div className="traffic-light">
      <div className={`light red ${state === LightState.Red ? 'on' : 'off'}`}></div>
      <div className={`light yellow ${state === LightState.RedYellow ? 'on' : 'off'}`}></div>
      <div className={`light green ${state === LightState.Green ? 'on' : 'off'}`}></div>
    </div>
  );
}
