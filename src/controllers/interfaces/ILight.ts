export interface ILight<TState> {
  getState(): TState;
  setState(state: TState): void;
  start(): void;
  stop(): void;
  dispose(): void;
}

export interface ITimedLight<TState> extends ILight<TState> {
  turnGreen(): Promise<void>;
  turnRed(): Promise<void>;
}

export interface IRequestableLight<TState> extends ILight<TState> {
  hasRequest(): boolean;
  requestChange(): void;
}

export interface IStateChangeNotifier<TState> {
  onStateChange?: (state: TState) => void;
}

export interface ITimingConfig {
  green: number;
  yellow: number;
  redYellow: number;
  transition: number;
}

export interface ILightController {
  getState(): any;
  setState(state: any): void;
}
