import { useState, useEffect, useCallback, useRef } from "react";
import { IntersectionController } from "@/controllers/IntersectionController";
import type { IntersectionState } from "@/controllers/interfaces/IIntersection";

export function useTrafficLight() {
  const controllerRef = useRef<IntersectionController | null>(null);

  // Move the state initialization after the ref declaration
  const [state, setState] = useState<IntersectionState>(() => {
    try {
      // Create a temporary state update function for initialization
      let initialController: IntersectionController;
      initialController = new IntersectionController((newState) => {
        if (controllerRef.current === initialController) {
          setState(newState);
        }
      });

      controllerRef.current = initialController;
      return initialController.getState();
    } catch (error) {
      console.error("Failed to initialize traffic light controller:", error);
      throw error; // Re-throw to prevent app from starting in invalid state
    }
  });

  useEffect(() => {
    // Cleanup on unmount or if controller changes
    return () => {
      if (controllerRef.current) {
        try {
          controllerRef.current.dispose();
        } catch (error) {
          console.error("Error during controller cleanup:", error);
        } finally {
          controllerRef.current = null;
        }
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (!controllerRef.current) return;
    try {
      await controllerRef.current.start();
    } catch (error) {
      console.error("Failed to start traffic light sequence:", error);
      throw error; // Let the UI handle the error
    }
  }, []);

  const stop = useCallback(() => {
    if (!controllerRef.current) return;
    try {
      controllerRef.current.stop();
    } catch (error) {
      console.error("Failed to stop traffic light sequence:", error);
      throw error;
    }
  }, []);

  const requestPedestrian = useCallback(() => {
    if (!controllerRef.current) return;
    try {
      controllerRef.current.requestPedestrian();
    } catch (error) {
      console.error("Failed to process pedestrian request:", error);
      // Don't throw here since this is a non-critical user action
    }
  }, []);

  return {
    ...state,
    start,
    stop,
    requestPedestrian,
  };
}
