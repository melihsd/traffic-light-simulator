import { useState, useEffect } from 'react';
import { TrafficLight, LightState } from '@/components/TrafficLight';
import { PedestrianLight, PedestrianState } from '@/components/PedestrianLight';
import { Button } from '@mui/material';
import { Road } from './Road';
import styles from '@/styles/Intersection.module.css';

export function App() {
    const [mainRoad, setMainRoad] = useState(LightState.Green);
    const [sideRoad, setSideRoad] = useState(LightState.Red);
    const [pedestrian, setPedestrian] = useState(PedestrianState.Red);
    const [pedestrianRequest, setPedestrianRequest] = useState(false);
  
    return (
      <div className="App">
        <Button variant="contained" className={styles.startButton}>
          Start
        </Button>
        <div className={styles.intersection}>
          <Road horizontal />
          <Road />
          <TrafficLight 
            state={mainRoad} 
            className={`horizontal-rtl ${styles['main-road']}`} 
          />
          <TrafficLight 
            state={sideRoad} 
            className={styles['side-road']} 
          />
          <PedestrianLight 
            state={pedestrian} 
            className={styles.pedestrian} 
          />
        </div>
        
        <Button 
          variant="contained" 
        >
          Pedestrian Request
        </Button>
      </div>
    );
  }