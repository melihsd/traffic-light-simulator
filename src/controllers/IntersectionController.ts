import { LightController } from "@/controllers/LightController";
import { LightStateCode } from "@/controllers/LightController";
import { TIMING } from "./config/timing";
import { Phase, PHASE_DESCRIPTIONS } from "./config/phases";
import {
  IntersectionState,
  IntersectionStateCallback,
} from "./interfaces/IIntersection";

// Minimum timing constants for safety
const SAFETY_CONSTRAINTS = {
  MIN_PHASE_DURATION_MS: 1000,
  MIN_YELLOW_DURATION_MS: 1000,
  MIN_PEDESTRIAN_GREEN_MS: 3000,
  STATE_UPDATE_INTERVAL_MS: 100,
} as const;

// Error messages for better debugging
const ERROR_MESSAGES = {
  INVALID_TIMING: (field: string) =>
    `Missing required timing configuration: ${field}`,
  YELLOW_DURATION: "Yellow light duration must be at least 1 second",
  PEDESTRIAN_DURATION:
    "Pedestrian green light duration must be at least 3 seconds",
  STATE_CHANGE: "Error in state change notification",
} as const;

export class IntersectionController {
  private readonly mainRoadLight: LightController = new LightController(
    "vehicle",
    LightStateCode.WARNING,
    { onStateChange: () => this.notifyStateChange() }
  );
  private readonly sideRoadLight: LightController = new LightController(
    "vehicle",
    LightStateCode.WARNING,
    { onStateChange: () => this.notifyStateChange() }
  );
  private readonly pedestrianLight: LightController = new LightController(
    "pedestrian",
    LightStateCode.WARNING,
    { onStateChange: () => this.notifyStateChange() }
  );

  private currentPhase: Phase = Phase.STOPPED;
  private isRunning: boolean = false;
  private timers: NodeJS.Timeout[] = [];
  private statusTimer?: NodeJS.Timeout;
  private lastPhaseChange: number = 0;

  constructor(
    private readonly onStateChange?: IntersectionStateCallback,
    private readonly timingConfig: typeof TIMING = TIMING
  ) {
    this.setInitialLightStates();
    this.startStatusUpdates();
  }

  private clearAllTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];

    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = undefined;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, Math.max(ms, 0));
      this.timers.push(timer);
    });
  }

  private async setPhase(
    phase: Phase,
    duration?: number,
    skipMinimumDuration: boolean = false
  ): Promise<void> {
    const now = Date.now();
    const timeSinceLastPhase = now - this.lastPhaseChange;

    // Ensure minimum phase duration for safety
    if (
      !skipMinimumDuration &&
      timeSinceLastPhase < SAFETY_CONSTRAINTS.MIN_PHASE_DURATION_MS
    ) {
      await this.wait(
        SAFETY_CONSTRAINTS.MIN_PHASE_DURATION_MS - timeSinceLastPhase
      );
    }

    this.currentPhase = phase;
    this.lastPhaseChange = Date.now();
    this.notifyStateChange();

    if (duration && duration > 0) {
      await this.wait(duration);
    }
  }

  private setInitialLightStates(): void {
    this.mainRoadLight.setState({
      state: LightStateCode.WARNING,
    });
    this.sideRoadLight.setState({
      state: LightStateCode.WARNING,
    });
    this.pedestrianLight.setState({
      state: LightStateCode.WARNING,
      hasRequest: false,
    });
  }

  private startStatusUpdates(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
    }
    this.statusTimer = setInterval(
      () => this.notifyStateChange(),
      SAFETY_CONSTRAINTS.STATE_UPDATE_INTERVAL_MS
    );
  }

  private notifyStateChange(): void {
    if (!this.onStateChange) return;

    try {
      const state: IntersectionState = {
        mainRoad: this.mainRoadLight.getState().state,
        sideRoad: this.sideRoadLight.getState().state,
        pedestrian: this.pedestrianLight.getState().state,
        pedestrianRequest: this.pedestrianLight.hasRequest(),
        currentPhase: this.currentPhase,
        isRunning: this.isRunning,
        statusText: PHASE_DESCRIPTIONS[this.currentPhase],
      };
      this.onStateChange(state);
    } catch (error) {
      console.error(ERROR_MESSAGES.STATE_CHANGE, error);
    }
  }

  private async handlePedestrianRequest(): Promise<boolean> {
    if (!this.pedestrianLight.hasRequest()) {
      return false;
    }

    try {
      this.pedestrianLight.setState({
        state: LightStateCode.GO,
        hasRequest: false,
      });
      await this.setPhase(Phase.PED_ONLY, this.timingConfig.PEDESTRIAN.green);

      this.pedestrianLight.setState({
        state: LightStateCode.STOP,
        hasRequest: false,
      });
      return true;
    } catch (error) {
      console.error("Error handling pedestrian request:", error);
      this.pedestrianLight.setState({
        state: LightStateCode.STOP,
        hasRequest: false,
      });
      return false;
    }
  }

  private async transitionToMainRoad(): Promise<void> {
    try {
      // Ensure all other lights are red
      this.sideRoadLight.setState({ state: LightStateCode.STOP });
      this.pedestrianLight.setState({ state: LightStateCode.STOP });

      // Wait between phases
      await this.wait(this.timingConfig.DEFAULT.red);

      // Red-yellow prepare phase
      this.mainRoadLight.setState({ state: LightStateCode.PREPARE });
      await this.wait(this.timingConfig.MAIN_ROAD.redYellow);

      // Go phase
      this.mainRoadLight.setState({ state: LightStateCode.GO });
      await this.setPhase(Phase.MAIN_ONLY);
    } catch (error) {
      console.error("Error transitioning to main road:", error);
      this.mainRoadLight.setState({ state: LightStateCode.STOP });
      throw error;
    }
  }

  private async transitionToSideRoad(): Promise<void> {
    try {
      // Ensure all other lights are red
      this.mainRoadLight.setState({ state: LightStateCode.STOP });
      this.pedestrianLight.setState({ state: LightStateCode.STOP });

      // Wait between phases
      await this.wait(this.timingConfig.DEFAULT.red);

      // Red-yellow prepare phase
      this.sideRoadLight.setState({ state: LightStateCode.PREPARE });
      await this.wait(this.timingConfig.DEFAULT.redYellow);

      // Go phase
      this.sideRoadLight.setState({ state: LightStateCode.GO });
      await this.setPhase(Phase.SIDE_ONLY);
    } catch (error) {
      console.error("Error transitioning to side road:", error);
      this.sideRoadLight.setState({ state: LightStateCode.STOP });
      throw error;
    }
  }

  private async handlePedestrianPhase(): Promise<void> {
    try {
      // Ensure all other lights are red
      this.mainRoadLight.setState({ state: LightStateCode.STOP });
      this.sideRoadLight.setState({ state: LightStateCode.STOP });

      // Wait between phases
      await this.wait(this.timingConfig.DEFAULT.red);

      // Go phase for pedestrians
      this.pedestrianLight.setState({
        state: LightStateCode.GO,
        hasRequest: false,
      });
      await this.setPhase(Phase.PED_ONLY, this.timingConfig.PEDESTRIAN.green);

      // Back to stop
      this.pedestrianLight.setState({
        state: LightStateCode.STOP,
        hasRequest: false,
      });
      await this.setPhase(
        Phase.PED_TO_SIDE,
        this.timingConfig.PEDESTRIAN.transition
      );
    } catch (error) {
      console.error("Error handling pedestrian phase:", error);
      this.pedestrianLight.setState({
        state: LightStateCode.STOP,
        hasRequest: false,
      });
      throw error;
    }
  }

  private async closeMainRoad(): Promise<void> {
    try {
      // Yellow attention phase
      this.mainRoadLight.setState({ state: LightStateCode.ATTENTION });
      await this.wait(this.timingConfig.MAIN_ROAD.yellow);

      // Stop phase
      this.mainRoadLight.setState({ state: LightStateCode.STOP });
      await this.setPhase(Phase.MAIN_TO_SIDE);
    } catch (error) {
      console.error("Error closing main road:", error);
      this.mainRoadLight.setState({ state: LightStateCode.STOP });
      throw error;
    }
  }

  private async closeSideRoad(): Promise<void> {
    try {
      // Yellow attention phase
      this.sideRoadLight.setState({ state: LightStateCode.ATTENTION });
      await this.wait(this.timingConfig.DEFAULT.yellow);

      // Stop phase
      this.sideRoadLight.setState({ state: LightStateCode.STOP });
      await this.setPhase(Phase.SIDE_TO_MAIN);
    } catch (error) {
      console.error("Error closing side road:", error);
      this.sideRoadLight.setState({ state: LightStateCode.STOP });
      throw error;
    }
  }

  private async handleMainRoadPhase(): Promise<void> {
    try {
      // Ensure all other lights are red
      this.sideRoadLight.setState({ state: LightStateCode.STOP });
      this.pedestrianLight.setState({
        state: LightStateCode.STOP,
        hasRequest: false,
      });

      // Go phase
      this.mainRoadLight.setState({ state: LightStateCode.GO });
      await this.setPhase(Phase.MAIN_ONLY, this.timingConfig.MAIN_ROAD.green);
    } catch (error) {
      console.error("Error handling main road phase:", error);
      this.resetToSafeState();
      throw error;
    }
  }

  private resetToSafeState(): void {
    this.mainRoadLight.setState({ state: LightStateCode.STOP });
    this.sideRoadLight.setState({ state: LightStateCode.STOP });
    this.pedestrianLight.setState({
      state: LightStateCode.STOP,
      hasRequest: false,
    });
    this.currentPhase = Phase.STOPPED;
  }

  private async runCycle(): Promise<void> {
    while (this.isRunning) {
      try {
        // Main road phase
        await this.handleMainRoadPhase();

        // Check for pedestrian request before transitioning to side road
        if (this.pedestrianLight.hasRequest()) {
          await this.closeMainRoad();
          await this.handlePedestrianPhase();
          await this.transitionToSideRoad();
        } else {
          await this.closeMainRoad();
          await this.transitionToSideRoad();
        }

        // Side road green phase
        await this.wait(this.timingConfig.DEFAULT.green);

        // Check for pedestrian request before transitioning back to main road
        if (this.pedestrianLight.hasRequest()) {
          await this.closeSideRoad();
          await this.handlePedestrianPhase();
          await this.transitionToMainRoad();
        } else {
          await this.closeSideRoad();
          await this.transitionToMainRoad();
        }
      } catch (error) {
        console.error("Error in traffic light cycle:", error);
        this.resetToSafeState();
        // Stop the cycle if there's an unrecoverable error
        this.stop();
        break;
      }
    }
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;

    try {
      this.isRunning = true;

      // Initialize lights - main road starts with green flow
      this.mainRoadLight.setState({
        state: LightStateCode.GO,
      });
      this.sideRoadLight.setState({
        state: LightStateCode.STOP,
      });
      this.pedestrianLight.setState({
        state: LightStateCode.STOP,
        hasRequest: false,
      });
      this.currentPhase = Phase.MAIN_ONLY;
      this.notifyStateChange();

      await this.runCycle();
    } catch (error) {
      console.error("Error starting traffic light system:", error);
      this.stop();
      throw error;
    }
  }

  public stop(): void {
    try {
      // Set stopped state first
      this.isRunning = false;
      this.currentPhase = Phase.STOPPED;
      this.lastPhaseChange = Date.now();

      // Clear timers after setting stopped state
      this.clearAllTimers();

      // Start blinking which will set initial state and begin blinking
      this.setInitialLightStates();

      // Ensure state is updated
      this.notifyStateChange();
    } catch (error) {
      console.error("Error stopping traffic light system:", error);
      // Ensure we're in a safe state even if something fails
      this.resetToSafeState();
      throw error;
    }
  }

  public requestPedestrian(): void {
    if (!this.isRunning) return;
    this.pedestrianLight.setRequest(true);
    this.notifyStateChange();
  }

  public dispose(): void {
    try {
      this.clearAllTimers();
      this.isRunning = false;
      this.currentPhase = Phase.STOPPED;
      this.resetToSafeState();
      this.notifyStateChange();
    } catch (error) {
      console.error("Error disposing traffic light system:", error);
      throw error;
    }
  }

  public getState(): IntersectionState {
    return {
      mainRoad: this.mainRoadLight.getState().state,
      sideRoad: this.sideRoadLight.getState().state,
      pedestrian: this.pedestrianLight.getState().state,
      pedestrianRequest: this.pedestrianLight.hasRequest(),
      currentPhase: this.currentPhase,
      isRunning: this.isRunning,
      statusText: PHASE_DESCRIPTIONS[this.currentPhase],
    };
  }
}
