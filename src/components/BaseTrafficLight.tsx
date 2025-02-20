import { styled } from '@mui/material/styles';

// Base container for all traffic lights
export const TrafficLightContainer = styled('div')<{ className?: string }>(({ theme, className }) => ({
  backgroundColor: '#333',
  padding: theme.spacing(1),
  borderRadius: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  width: 60,
  zIndex:2,
  alignItems: 'center',
  '&.horizontal': {
    flexDirection: 'row',
    width: 'auto',
    height: 60
  },
  '&.horizontal-rtl': {
    flexDirection: 'row-reverse',
    width: 'auto',
    height: 60
  }
}));

// Base light component
export const Light = styled('div')<{ $isOn: boolean; $color: string }>(({ $isOn, $color }) => ({
  width: 35,
  height: 35,
  borderRadius: '50%',
  backgroundColor: $isOn ? $color : '#1a1a1a',
  border: '2px solid #000',
  boxShadow: $isOn ? `0 0 20px ${$color}` : 'none',
  transition: 'all 0.3s ease',
}));

// Base props interface
export interface BaseTrafficLightProps {
  className?: string;
} 