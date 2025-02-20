export enum Phase {
  STOPPED = "STOPPED",
  MAIN_ONLY = "MAIN_ONLY",
  MAIN_TO_SIDE = "MAIN_TO_SIDE",
  SIDE_ONLY = "SIDE_ONLY",
  SIDE_TO_PED = "SIDE_TO_PED",
  PED_ONLY = "PED_ONLY",
  PED_TO_SIDE = "PED_TO_SIDE",
  SIDE_TO_MAIN = "SIDE_TO_MAIN",
}

export const PHASE_DESCRIPTIONS: Record<Phase, string> = {
  [Phase.STOPPED]: "System stopped (warning lights)",
  [Phase.MAIN_ONLY]: "Main road traffic flowing",
  [Phase.MAIN_TO_SIDE]: "Switching from main to side road",
  [Phase.SIDE_ONLY]: "Side road traffic flowing",
  [Phase.SIDE_TO_PED]: "Switching from side road to pedestrian",
  [Phase.PED_ONLY]: "Pedestrian crossing active",
  [Phase.PED_TO_SIDE]: "Switching from pedestrian to side road",
  [Phase.SIDE_TO_MAIN]: "Switching from side to main road",
} as const;
