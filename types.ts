
export interface Pen {
  id: string;
  type: number;
  quantity: number;
}

export enum PlanningMode {
  InventoryOnly = 'inventoryOnly',
  StandardLadder = 'standardLadder',
}

export interface PlanStep {
  weekRange: string;
  weeklyDose: number;
  penType: number;
  weeksForPen: number;
  totalMgUsed: number;
  remainingMg: number;
  suggestion: string;
  notes: string[];
  isError?: boolean;
  microdoseClicks?: number;
  instanceId?: number; // Added: Identifies the specific physical pen instance
}

export interface PlanSummary {
  totalWeeks: number;
  penUsage: { type: number, used: number }[];
  totalWasteMg: number;
  wasteRate: number;
  finalSuggestion: string;
}

export interface PlanResult {
  steps: PlanStep[];
  summary: PlanSummary;
}

export type Brand = 'mounjaro' | 'wegovy';

export interface BrandConfig {
  name: string;
  penTypes: number[];
  capacityMultiplier: number; // e.g., 5 for Mounjaro, 4 for Wegovy
  microdoseMap: Map<number, number[]>;
  standardLadder: number[];
  themeColor: string; // Tailwind class prefix or similar identifier
  unit: string;
  ticksPerFullDose: number; // Added: e.g., 60 for Mounjaro, 72 for Wegovy
}
