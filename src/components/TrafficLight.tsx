import { styled } from "@mui/material/styles";
import { LightStateCode } from "@/controllers/LightController";

// Base container for all traffic lights
const TrafficLightContainer = styled("div")<{ className?: string }>(
  ({ theme, className }) => ({
    backgroundColor: "#333",
    padding: theme.spacing(1),
    borderRadius: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    width: 60,
    zIndex: 2,
    alignItems: "center",
    "&.horizontal": {
      flexDirection: "row",
      width: "auto",
      height: 60,
    },
    "&.horizontal-rtl": {
      flexDirection: "row-reverse",
      width: "auto",
      height: 60,
    },
  })
);

// Base light component
const Light = styled("div")<{
  $isOn: boolean;
  $color: string;
  $isWarning?: boolean;
}>(({ $isOn, $color, $isWarning }) => ({
  width: 35,
  height: 35,
  borderRadius: "50%",
  backgroundColor: $isWarning
    ? "#1a1a1a" // Start with off state for warning
    : $isOn
    ? $color
    : "#1a1a1a",
  border: "2px solid #000",
  boxShadow: $isWarning
    ? "none" // Start with off state for warning
    : $isOn
    ? `0 0 20px ${$color}`
    : "none",
  transition: "all 0.3s ease",
  animation: $isWarning ? `blink-${$color.substring(1)} 2s infinite` : "none",
  // Create unique animation name for each color to prevent conflicts
  [`@keyframes blink-${$color.substring(1)}`]: {
    "0%, 49%": {
      backgroundColor: $color,
      boxShadow: `0 0 20px ${$color}`,
    },
    "50%, 100%": {
      backgroundColor: "#1a1a1a",
      boxShadow: "none",
    },
  },
}));

export enum LightState {
  Off,
  Red,
  RedYellow,
  Yellow,
  Green,
}

interface TrafficLightProps {
  state: LightStateCode;
  className?: string;
  type?: "vehicle" | "pedestrian";
}

export function TrafficLight({
  state,
  className,
  type = "vehicle",
}: TrafficLightProps) {
  if (type === "pedestrian") {
    return (
      <TrafficLightContainer className={className}>
        <Light
          $isOn={
            state === LightStateCode.STOP ||
            state === LightStateCode.PREPARE ||
            state === LightStateCode.WARNING
          }
          $color="#ff0000"
          $isWarning={state === LightStateCode.WARNING}
        />
        <Light
          $isOn={
            state === LightStateCode.GO || state === LightStateCode.ATTENTION
          }
          $color="#00ff00"
        />
      </TrafficLightContainer>
    );
  }

  return (
    <TrafficLightContainer className={className}>
      <Light
        $isOn={
          state === LightStateCode.STOP || state === LightStateCode.PREPARE
        }
        $color="#ff0000"
      />
      <Light
        $isOn={
          state === LightStateCode.ATTENTION ||
          state === LightStateCode.WARNING ||
          state === LightStateCode.PREPARE
        }
        $color="#ffff00"
        $isWarning={state === LightStateCode.WARNING}
      />
      <Light $isOn={state === LightStateCode.GO} $color="#00ff00" />
    </TrafficLightContainer>
  );
}
