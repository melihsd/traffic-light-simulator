import { LightState } from "@/components/TrafficLight";
import { ITimingConfig, ILightController } from "./interfaces/ILight";

export class VehicleLightController implements ILightController {
  private state: LightState;

  constructor(
    initialState: LightState,
    private options: { onStateChange?: () => void } = {}
  ) {
    this.state = initialState;
  }

  public getState(): LightState {
    return this.state;
  }

  public setState(state: LightState): void {
    this.state = state;
    this.options.onStateChange?.();
  }
}
