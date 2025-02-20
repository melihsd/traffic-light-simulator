export enum PedestrianState {
  Red,
  Green
}

interface PedestrianLightProps {
  state: PedestrianState;
}

export function PedestrianLight({ state }: PedestrianLightProps) {
  return (
    <div className="pedestrian-light">
      <div className={`light red ${state === PedestrianState.Red ? 'on' : 'off'}`}></div>
      <div className={`light green ${state === PedestrianState.Green ? 'on' : 'off'}`}></div>
    </div>
  );
} 
