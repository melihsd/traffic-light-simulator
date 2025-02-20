import { ILightController } from "./interfaces/ILight";

export type LightType = "vehicle" | "pedestrian";

export enum LightStateCode {
  STOP = "STOP",
  PREPARE = "PREPARE",
  GO = "GO",
  ATTENTION = "ATTENTION",
  WARNING = "WARNING",
}

interface LightControllerState {
  type: LightType;
  state: LightStateCode;
  hasRequest?: boolean;
}

export class LightController implements ILightController {
  private state: LightControllerState;

  constructor(
    type: LightType,
    initialState: LightStateCode = LightStateCode.WARNING,
    private options: { onStateChange?: () => void } = {}
  ) {
    this.state = {
      type,
      state: initialState,
      hasRequest: type === "pedestrian" ? false : undefined,
    };
  }

  public getState(): LightControllerState {
    return { ...this.state };
  }

  public setState(newState: Partial<LightControllerState>): void {
    // If setting WARNING state, automatically set isBlinking to true
    this.state = { ...this.state, ...newState };
    this.options.onStateChange?.();
  }

  public hasRequest(): boolean {
    if (this.state.type !== "pedestrian") {
      throw new Error("hasRequest is only available for pedestrian lights");
    }
    return this.state.hasRequest || false;
  }

  public setRequest(hasRequest: boolean): void {
    if (this.state.type !== "pedestrian") {
      throw new Error("setRequest is only available for pedestrian lights");
    }
    this.setState({ hasRequest });
  }
}
