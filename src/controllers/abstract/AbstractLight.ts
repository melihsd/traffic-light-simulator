import {
  ILight,
  IStateChangeNotifier,
  ITimingConfig,
} from "../interfaces/ILight";

export abstract class AbstractLight<TState> implements ILight<TState> {
  protected currentState: TState;
  protected isRunning: boolean = false;
  protected timers: NodeJS.Timeout[] = [];
  protected readonly timing: ITimingConfig;
  protected readonly notifier?: IStateChangeNotifier<TState>;

  constructor(
    initialState: TState,
    timing: ITimingConfig,
    notifier?: IStateChangeNotifier<TState>
  ) {
    this.currentState = initialState;
    this.timing = timing;
    this.notifier = notifier;
  }

  public setState(state: TState): void {
    this.currentState = state;
    this.notifier?.onStateChange?.(state);
  }

  public getState(): TState {
    return this.currentState;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
  }

  public stop(): void {
    this.isRunning = false;
    this.clearTimers();
  }

  public dispose(): void {
    this.stop();
  }

  protected clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  protected addTimer(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, duration);
      this.timers.push(timer);
    });
  }
}
