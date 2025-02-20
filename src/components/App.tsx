import { useState, useEffect } from "react";
import { TrafficLight, LightState } from "@/components/TrafficLight";
import { PedestrianLight, PedestrianState } from "@/components/PedestrianLight";
import { Road } from "@/components/Road";
import { Crosswalk } from "@/components/Crosswalk";
import { IconCircleDot } from "@/assets/IconCircleDot";
import { IconButton } from "@mui/material";
export function App() {
  const [mainRoad, setMainRoad] = useState(LightState.Green);
  const [sideRoad, setSideRoad] = useState(LightState.Red);
  const [pedestrian, setPedestrian] = useState(PedestrianState.Red);
  const [pedestrianRequest, setPedestrianRequest] = useState(false);

  return (
    <div className="App">
      <div className={styles.startButtonContainer}>
        <h1>Traffic Light Simulator</h1>
        <Button variant="contained" className={styles.startButton}>
          START
        </Button>
      </div>
      <div className={styles.intersection}>
        <Road horizontal />
        <Road />
        <TrafficLight
          state={mainRoad}
          className={`horizontal-rtl ${styles["main-road"]}`}
        />
        <TrafficLight state={sideRoad} className={styles["side-road"]} />

        <div className={styles.pedestrian}>
          <PedestrianLight state={pedestrian} />
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
