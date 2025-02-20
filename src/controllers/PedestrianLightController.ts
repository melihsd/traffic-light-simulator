import { PedestrianState } from "@/components/PedestrianLight";
import { ILightController } from "./interfaces/ILight";

interface PedestrianLightState {
  state: PedestrianState;
  hasRequest: boolean;
}

export class PedestrianLightController implements ILightController {
  private state: PedestrianLightState = {
    state: PedestrianState.Red,
    hasRequest: false,
  };

  constructor(private options: { onStateChange?: () => void } = {}) {}

  public getState(): PedestrianLightState {
    return this.state;
  }

  public setState(state: PedestrianLightState): void {
    this.state = state;
    this.options.onStateChange?.();
  }

  public hasRequest(): boolean {
    return this.state.hasRequest;
  }
}
