import { VehicleLightController } from "@/controllers/VehicleLightController";
import { PedestrianLightController } from "@/controllers/PedestrianLightController";
import { LightState } from "@/components/TrafficLight";
import { PedestrianState } from "@/components/PedestrianLight";
import { TIMING, PHASE_TIMINGS } from "./config/timing";
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
  private readonly mainRoadLight: VehicleLightController =
    new VehicleLightController(LightState.Yellow, {
      onStateChange: () => this.notifyStateChange(),
    });
  private readonly sideRoadLight: VehicleLightController =
    new VehicleLightController(LightState.Yellow, {
      onStateChange: () => this.notifyStateChange(),
    });
  private readonly pedestrianLight: PedestrianLightController =
    new PedestrianLightController({
      onStateChange: () => this.notifyStateChange(),
    });
  private currentPhase: Phase = Phase.STOPPED;
  private isRunning: boolean = false;
  private timers: NodeJS.Timeout[] = [];
  private blinkTimer?: NodeJS.Timeout;
  private statusTimer?: NodeJS.Timeout;
  private lastPhaseChange: number = 0;

  constructor(
    private readonly onStateChange?: IntersectionStateCallback,
    private readonly timingConfig: typeof TIMING = TIMING
  ) {
    this.validateTimingConfig();
    this.startBlinking();
    this.startStatusUpdates();
  }

  private validateTimingConfig(): void {
    const requiredFields = [
      "BLINK_INTERVAL",
      "DEFAULT",
      "MAIN_ROAD",
      "PEDESTRIAN",
    ] as const;

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in this.timingConfig)) {
        throw new Error(ERROR_MESSAGES.INVALID_TIMING(field));
      }
    }

    // Validate safety constraints
    if (
      this.timingConfig.DEFAULT.yellow <
      SAFETY_CONSTRAINTS.MIN_YELLOW_DURATION_MS
    ) {
      throw new Error(ERROR_MESSAGES.YELLOW_DURATION);
    }
    if (
      this.timingConfig.PEDESTRIAN.green <
      SAFETY_CONSTRAINTS.MIN_PEDESTRIAN_GREEN_MS
    ) {
      throw new Error(ERROR_MESSAGES.PEDESTRIAN_DURATION);
    }
  }

  private clearAllTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
      this.blinkTimer = undefined;
    }
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

  private startBlinking(): void {
    this.stopBlinking();
    this.setInitialLightStates();
    this.startBlinkingCycle();
  }

  private stopBlinking(): void {
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer);
      this.blinkTimer = undefined;
    }
  }

  private setInitialLightStates(): void {
    this.mainRoadLight.setState(LightState.Yellow);
    this.sideRoadLight.setState(LightState.Yellow);
    this.pedestrianLight.setState({
      state: PedestrianState.Red,
      hasRequest: false,
    });
  }

  private startBlinkingCycle(): void {
    let isBlinkOn = true;
    this.blinkTimer = setInterval(() => {
      if (!this.isRunning) {
        isBlinkOn = !isBlinkOn;
        const vehicleState = isBlinkOn ? LightState.Yellow : LightState.Off;
        const pedestrianState = isBlinkOn
          ? PedestrianState.Red
          : PedestrianState.Off;

        this.mainRoadLight.setState(vehicleState);
        this.sideRoadLight.setState(vehicleState);
        this.pedestrianLight.setState({
          state: pedestrianState,
          hasRequest: false,
        });
      }
    }, this.timingConfig.BLINK_INTERVAL);
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
        mainRoad: this.mainRoadLight.getState(),
        sideRoad: this.sideRoadLight.getState(),
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
      // Pedestrian crossing phase
      this.pedestrianLight.setState({
        state: PedestrianState.Green,
        hasRequest: false,
      });
      await this.setPhase(Phase.PED_ONLY, this.timingConfig.PEDESTRIAN.green);

      this.pedestrianLight.setState({
        state: PedestrianState.Red,
        hasRequest: false,
      });
      return true;
    } catch (error) {
      console.error("Error handling pedestrian request:", error);
      // Reset to safe state
      this.pedestrianLight.setState({
        state: PedestrianState.Red,
        hasRequest: false,
      });
      return false;
    }
  }

  private async transitionToMainRoad(): Promise<void> {
    try {
      this.mainRoadLight.setState(LightState.RedYellow);
      await this.wait(this.timingConfig.MAIN_ROAD.redYellow);
      this.mainRoadLight.setState(LightState.Green);
      await this.setPhase(Phase.MAIN_ONLY);
    } catch (error) {
      console.error("Error transitioning to main road:", error);
      // Reset to safe state
      this.mainRoadLight.setState(LightState.Red);
      throw error;
    }
  }

  private async transitionToSideRoad(): Promise<void> {
    try {
      this.sideRoadLight.setState(LightState.RedYellow);
      await this.wait(this.timingConfig.DEFAULT.redYellow);
      this.sideRoadLight.setState(LightState.Green);
      await this.setPhase(Phase.SIDE_ONLY, this.timingConfig.DEFAULT.green);
    } catch (error) {
      console.error("Error transitioning to side road:", error);
      // Reset to safe state
      this.sideRoadLight.setState(LightState.Red);
      throw error;
    }
  }

  private async handlePedestrianPhase(): Promise<void> {
    try {
      this.pedestrianLight.setState({
        state: PedestrianState.Green,
        hasRequest: false,
      });
      await this.setPhase(Phase.PED_ONLY, this.timingConfig.PEDESTRIAN.green);

      this.pedestrianLight.setState({
        state: PedestrianState.Red,
        hasRequest: false,
      });
      await this.setPhase(
        Phase.PED_TO_SIDE,
        this.timingConfig.PEDESTRIAN.transition
      );
    } catch (error) {
      console.error("Error handling pedestrian phase:", error);
      // Reset to safe state
      this.pedestrianLight.setState({
        state: PedestrianState.Red,
        hasRequest: false,
      });
      throw error;
    }
  }

  private async closeMainRoad(): Promise<void> {
    try {
      this.mainRoadLight.setState(LightState.Yellow);
      await this.setPhase(
        Phase.MAIN_TO_SIDE,
        this.timingConfig.MAIN_ROAD.yellow
      );
      this.mainRoadLight.setState(LightState.Red);
      await this.wait(this.timingConfig.MAIN_ROAD.red);
    } catch (error) {
      console.error("Error closing main road:", error);
      // Reset to safe state
      this.mainRoadLight.setState(LightState.Red);
      throw error;
    }
  }

  private async closeSideRoad(): Promise<void> {
    try {
      this.sideRoadLight.setState(LightState.Yellow);
      await this.setPhase(Phase.SIDE_TO_MAIN, this.timingConfig.DEFAULT.yellow);
      this.sideRoadLight.setState(LightState.Red);
      await this.wait(this.timingConfig.DEFAULT.red);
    } catch (error) {
      console.error("Error closing side road:", error);
      // Reset to safe state
      this.sideRoadLight.setState(LightState.Red);
      throw error;
    }
  }

  private async handleMainRoadPhase(): Promise<void> {
    try {
      this.mainRoadLight.setState(LightState.Green);
      this.sideRoadLight.setState(LightState.Red);
      this.pedestrianLight.setState({
        state: PedestrianState.Red,
        hasRequest: false,
      });
      await this.setPhase(Phase.MAIN_ONLY, this.timingConfig.MAIN_ROAD.green);
    } catch (error) {
      console.error("Error handling main road phase:", error);
      // Reset to safe state
      this.resetToSafeState();
      throw error;
    }
  }

  private resetToSafeState(): void {
    this.mainRoadLight.setState(LightState.Red);
    this.sideRoadLight.setState(LightState.Red);
    this.pedestrianLight.setState({
      state: PedestrianState.Red,
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
          await this.transitionToSideRoad();
        } else {
          await this.closeSideRoad();
        }

        // Back to main road
        await this.transitionToMainRoad();
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
      this.mainRoadLight.setState(LightState.Green);
      this.sideRoadLight.setState(LightState.Red);
      this.pedestrianLight.setState({
        state: PedestrianState.Red,
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
      this.startBlinking();

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
    try {
      // Accept pedestrian requests any time except during pedestrian phases
      // or when the system is stopped
      if (
        this.isRunning &&
        this.currentPhase !== Phase.PED_ONLY &&
        this.currentPhase !== Phase.SIDE_TO_PED &&
        this.currentPhase !== Phase.PED_TO_SIDE
      ) {
        this.pedestrianLight.setState({
          state: PedestrianState.Red,
          hasRequest: true,
        });
        this.notifyStateChange();
      }
    } catch (error) {
      console.error("Error processing pedestrian request:", error);
    }
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
      mainRoad: this.mainRoadLight.getState(),
      sideRoad: this.sideRoadLight.getState(),
      pedestrian: this.pedestrianLight.getState().state,
      pedestrianRequest: this.pedestrianLight.hasRequest(),
      currentPhase: this.currentPhase,
      isRunning: this.isRunning,
      statusText: PHASE_DESCRIPTIONS[this.currentPhase],
    };
  }
}
