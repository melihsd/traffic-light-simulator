import { useState, useEffect } from 'react';
import { TrafficLight, LightState } from '@/components/TrafficLight';
import { PedestrianLight, PedestrianState } from '@/components/PedestrianLight';
import { Button } from '@mui/material';
function App() {
    const [mainRoad, setMainRoad] = useState(LightState.Green);
    const [sideRoad, setSideRoad] = useState(LightState.Red);
    const [pedestrian, setPedestrian] = useState(PedestrianState.Red);
    const [pedestrianRequest, setPedestrianRequest] = useState(false);
  
    // Main state machine logic
    useEffect(() => {
      let timer: NodeJS.Timeout;
      
      // Handle pedestrian requests
      if (pedestrianRequest && mainRoad === LightState.Green) {
        timer = setTimeout(() => {
          setMainRoad(LightState.Yellow);
        }, 1000);
      }
      
      // Handle side road sequence
      if (sideRoad === LightState.Green) {
        timer = setTimeout(() => {
          setSideRoad(LightState.Yellow);
        }, 5000);
      }
  
      return () => clearTimeout(timer);
    }, [mainRoad, sideRoad, pedestrianRequest]);
  
    return (
      <div className="App">
        <TrafficLight state={mainRoad} />
        <TrafficLight state={sideRoad} />
        <PedestrianLight state={pedestrian} />
        <Button 
          variant="contained" 
          onClick={() => setPedestrianRequest(true)}
        >
          Pedestrian Request
        </Button>
      </div>
    );
  }