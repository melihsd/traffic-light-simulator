import { Button, IconButton } from "@mui/material";
import { TrafficLight } from "@/components/TrafficLight";
import { Road } from "@/components/Road";
import { Crosswalk } from "@/components/Crosswalk";
import { IconCircleDot } from "@/assets/IconCircleDot";
import { useTrafficLight } from "@/hooks/useTrafficLight";
import { LightStateCode } from "@/controllers/LightController";
import styles from "@/styles/Intersection.module.css";

function ControlPanel({
  isRunning,
  statusText,
  onToggle,
}: {
  isRunning: boolean;
  statusText: string;
  onToggle: () => void;
}) {
  return (
    <div className={styles.startButtonContainer}>
      <h1>Traffic Light Simulator</h1>
      <div className={styles.status}>{statusText}</div>
      <Button
        variant="contained"
        onClick={onToggle}
        className={styles.startButton}
        color={isRunning ? "error" : "primary"}
      >
        {isRunning ? "STOP" : "START"}
      </Button>
    </div>
  );
}

function PedestrianButton({
  isRunning,
  state,
  isRequested,
  onRequest,
}: {
  isRunning: boolean;
  state: LightStateCode;
  isRequested: boolean;
  onRequest: () => void;
}) {
  const isDisabled = !isRunning || isRequested || state === LightStateCode.GO;

  return (
    <IconButton
      aria-label="Pedestrian Request"
      color={isRequested ? "secondary" : "primary"}
      onClick={onRequest}
      disabled={isDisabled}
    >
      <IconCircleDot />
    </IconButton>
  );
}

export function App() {
  const {
    mainRoad,
    sideRoad,
    pedestrian,
    pedestrianRequest,
    isRunning,
    statusText,
    isBlinking,
    start,
    stop,
    requestPedestrian,
  } = useTrafficLight();

  const handleToggle = () => (isRunning ? stop() : start());

  return (
    <div className="App">
      <ControlPanel
        isRunning={isRunning}
        statusText={statusText}
        onToggle={handleToggle}
      />

      <div className={styles.intersection}>
        <Road horizontal />
        <Road />
        <TrafficLight
          state={mainRoad}
          className={`horizontal-rtl ${styles["main-road"]}`}
          type="vehicle"
          isBlinking={isBlinking}
        />
        <TrafficLight
          state={sideRoad}
          className={styles["side-road"]}
          type="vehicle"
          isBlinking={isBlinking}
        />

        <div className={styles.pedestrian}>
          <TrafficLight
            state={pedestrian}
            type="pedestrian"
            isBlinking={isBlinking}
          />
          <PedestrianButton
            isRunning={isRunning}
            state={pedestrian}
            isRequested={pedestrianRequest}
            onRequest={requestPedestrian}
          />
        </div>

        <div className={styles.crosswalk}>
          <Crosswalk />
        </div>
      </div>
    </div>
  );
}
