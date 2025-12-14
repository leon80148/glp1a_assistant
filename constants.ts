
import { Brand, BrandConfig } from './types';

// --- MOUNJARO CONFIG ---
// Mounjaro KwikPen: 60 clicks per full dose
// Valid doses are usually steps of 2.5mg
const MOUNJARO_TYPES = [2.5, 5, 7.5, 10, 12.5, 15];

const MOUNJARO_MICRODOSE_MAP = new Map<number, number[]>([
    [5, [2.5]],
    [7.5, [5, 2.5]],
    [10, [7.5, 5, 2.5]],
    // 12.5mg Pen specific microdoses (strictly Mounjaro units)
    [12.5, [10, 7.5, 5, 2.5]], 
    [15, [12.5, 10, 7.5, 5, 2.5]],
]);

export const MOUNJARO_CONFIG: BrandConfig = {
    name: '猛健樂 (Mounjaro)',
    penTypes: MOUNJARO_TYPES,
    capacityMultiplier: 5, // 4 doses + 1 extra (Total 5 doses volume)
    microdoseMap: MOUNJARO_MICRODOSE_MAP,
    standardLadder: [2.5, 5, 7.5, 10, 12.5, 15],
    themeColor: 'cyan',
    unit: 'mg',
    ticksPerFullDose: 60 // Standard KwikPen ticks
};

// --- WEGOVY CONFIG ---
// Wegovy FlexTouch: 72 clicks per full dose usually (varies by region, but 72 is common standard for calc)
const WEGOVY_TYPES = [0.25, 0.5, 1.0, 1.7, 2.4];

// Logic: Higher dose pens can deliver lower standard steps
// Added 0.75mg as a commonly used intermediate microdose step
const WEGOVY_MICRODOSE_MAP = new Map<number, number[]>([
    [0.5, [0.25]],
    [1.0, [0.75, 0.5, 0.25]],
    [1.7, [1.0, 0.75, 0.5, 0.25]],
    [2.4, [1.7, 1.0, 0.75, 0.5, 0.25]]
]);

export const WEGOVY_CONFIG: BrandConfig = {
    name: '週纖達 (Wegovy)',
    penTypes: WEGOVY_TYPES,
    capacityMultiplier: 4, // Strictly 4 doses per pen
    microdoseMap: WEGOVY_MICRODOSE_MAP,
    standardLadder: [0.25, 0.5, 1.0, 1.7, 2.4],
    themeColor: 'emerald', // Greenish theme for Wegovy
    unit: 'mg',
    ticksPerFullDose: 72 // Standard Wegovy ticks
};

export const BRANDS: Record<Brand, BrandConfig> = {
    mounjaro: MOUNJARO_CONFIG,
    wegovy: WEGOVY_CONFIG
};

export const LADDER_STEP_WEEKS = 4;
