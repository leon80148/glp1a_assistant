
import { Pen, PlanResult, PlanStep, PlanSummary, BrandConfig } from '../types';
import { LADDER_STEP_WEEKS } from '../constants';

interface PenInstance extends Pen {
    instanceId: number;
    totalCapacity: number;
    remainingCapacity: number;
}

// --- Helper Functions ---

const getAvailableDoses = (penType: number, maxDose: number, allowMicrodose: boolean, config: BrandConfig): number[] => {
  const doses: Set<number> = new Set();
  
  // Add the pen's native dose if within limit
  if (penType <= maxDose) {
    doses.add(penType);
  }
  
  // Add microdoses from the map
  if (allowMicrodose && config.microdoseMap.has(penType)) {
    const microdoses = config.microdoseMap.get(penType)!;
    microdoses.forEach(dose => {
      if (dose <= maxDose) {
        doses.add(dose);
      }
    });
  }
  
  return Array.from(doses).sort((a, b) => b - a);
};

const flattenInventory = (inventory: Pen[], config: BrandConfig): PenInstance[] => {
  const instances: PenInstance[] = [];
  let instanceIdCounter = 0;
  inventory.forEach(pen => {
    for (let i = 0; i < pen.quantity; i++) {
      const totalCapacity = pen.type * config.capacityMultiplier;
      instances.push({
        ...pen,
        instanceId: instanceIdCounter++,
        totalCapacity,
        remainingCapacity: totalCapacity,
      });
    }
  });
  return instances;
};

const calculateClicks = (targetDose: number, penType: number, config: BrandConfig): number => {
    if (penType === 0) return 0;
    return Math.round((targetDose / penType) * config.ticksPerFullDose);
};

const consolidateSteps = (steps: PlanStep[]): PlanStep[] => {
  if (steps.length < 2) return steps;
  const consolidated: PlanStep[] = [];
  let currentStep = { ...steps[0] };

  let currentEndWeekStr = (currentStep.weekRange.split(' - ')[1] || currentStep.weekRange.split(' ')[1]);
  let currentEndWeek = parseInt(currentEndWeekStr.replace('週','').trim());


  for (let i = 1; i < steps.length; i++) {
    const nextStep = steps[i];
    
    // Check for mergeability
    // CRITICAL: We now also check instanceId. We do NOT merge steps from different physical pens automatically.
    // This preserves the "Zone per Pen" structure.
    const canMerge = 
        nextStep.weeklyDose === currentStep.weeklyDose &&
        nextStep.penType === currentStep.penType &&
        nextStep.instanceId === currentStep.instanceId && // Ensure same physical pen
        JSON.stringify(nextStep.notes.sort()) === JSON.stringify(currentStep.notes.sort());

    if (canMerge) {
      const startWeek = parseInt(currentStep.weekRange.split(' ')[1]);
      const endWeekStr = (nextStep.weekRange.split(' - ')[1] || nextStep.weekRange.split(' ')[1]);
      const endWeek = parseInt(endWeekStr.replace('週','').trim());

      currentStep.weekRange = `第 ${startWeek} - ${endWeek} 週`;
      currentStep.weeksForPen += nextStep.weeksForPen;
      currentStep.totalMgUsed += nextStep.totalMgUsed;
      currentStep.remainingMg = nextStep.remainingMg; 
      currentStep.suggestion = nextStep.suggestion; 
      currentEndWeek = endWeek;
    } else {
      consolidated.push(currentStep);
      currentStep = { ...nextStep };
      const endWeekStr = (currentStep.weekRange.split(' - ')[1] || currentStep.weekRange.split(' ')[1]);
      currentEndWeek = parseInt(endWeekStr.replace('週','').trim());
    }
  }
  consolidated.push(currentStep);
  return consolidated;
};

const createSummary = (steps: PlanStep[], originalInventory: Pen[], config: BrandConfig): PlanSummary => {
    if (steps.length === 0 || steps.every(s => s.isError)) {
        return {
            totalWeeks: 0, penUsage: [], totalWasteMg: 0, wasteRate: 0,
            finalSuggestion: steps[0]?.suggestion || "無法產生規劃。"
        };
    }
    
    let totalCapacity = 0;
    originalInventory.forEach(p => {
        totalCapacity += p.type * config.capacityMultiplier * p.quantity;
    });

    // Note: consolidation for summary doesn't need to be strict about instanceId for *counting* purposes,
    // but we use the helper which is now strict. It's fine.
    const consolidatedSteps = consolidateSteps(steps);
    const totalWeeks = consolidatedSteps.reduce((acc, step) => acc + (step.isError ? 0 : step.weeksForPen), 0);

    const penConsumption = new Map<number, number>(); 
    steps.forEach(step => {
        if (!step.isError) {
            penConsumption.set(step.penType, (penConsumption.get(step.penType) || 0) + step.totalMgUsed);
        }
    });

    const penUsage = Array.from(penConsumption.entries()).map(([type, totalMgUsed]) => {
        const capacityPerPen = type * config.capacityMultiplier;
        const pensOfTypeInInventory = originalInventory.find(p => p.type === type)?.quantity || 0;
        const usedCount = Math.ceil(totalMgUsed / capacityPerPen);
        return { type, used: Math.min(usedCount, pensOfTypeInInventory) };
    }).sort((a,b) => a.type - b.type);

    const totalMgUsedInPlan = steps.reduce((sum, step) => sum + (step.isError ? 0 : step.totalMgUsed), 0);
    const totalWasteMg = Math.max(0, totalCapacity - totalMgUsedInPlan);

    const lastStep = steps[steps.length - 1];
    const finalSuggestion = lastStep?.isError ? lastStep.suggestion : totalWasteMg > 0.1 ? '療程規劃完畢，但仍有部分殘餘藥量。' : '完美規劃！所有注射筆皆已用盡，無浪費。';

    return {
        totalWeeks,
        penUsage,
        totalWasteMg,
        wasteRate: totalCapacity > 0 ? (totalWasteMg / totalCapacity) * 100 : 0,
        finalSuggestion,
    };
};

const findBestPenForDose = (
    candidates: PenInstance[], 
    dose: number, 
    maxDose: number, 
    allowMicrodose: boolean,
    config: BrandConfig
): PenInstance | null => {
    const validCandidates = candidates.filter(p => 
        p.remainingCapacity >= dose && getAvailableDoses(p.type, maxDose, allowMicrodose, config).includes(dose)
    );

    if (validCandidates.length === 0) return null;

    validCandidates.sort((a, b) => {
        // 1. Opened status (Highest Priority) - Always finish opened pens first
        const aOpened = a.remainingCapacity < a.totalCapacity;
        const bOpened = b.remainingCapacity < b.totalCapacity;
        if (aOpened && !bOpened) return -1;
        if (!aOpened && bOpened) return 1;

        // 2. Exact Match (Prefer exact match)
        const aExact = a.type === dose;
        const bExact = b.type === dose;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 3. Pen size (Smallest to Largest) - STRICT PRIORITY
        // This ensures we always move from small pens to large pens
        if (a.type !== b.type) {
            return a.type - b.type;
        }

        // 4. Remainder Correction (Demoted to tie-breaker)
        // Only relevant if we have identical size pens (unlikely to differ in remainder unless one is partially used, which is caught by rule #1)
        if (allowMicrodose && dose < maxDose) {
            const tolerance = 0.05;
            const isAligned = (val: number) => Math.abs(val) < tolerance || Math.abs(val - maxDose) < tolerance;

            const aRemainderMisalignment = a.remainingCapacity % maxDose;
            const bRemainderMisalignment = b.remainingCapacity % maxDose;
            const aFixes = isAligned((a.remainingCapacity - dose) % maxDose);
            const bFixes = isAligned((b.remainingCapacity - dose) % maxDose);
            
            if (!isAligned(aRemainderMisalignment) && aFixes && !bFixes) return -1;
            if (!isAligned(bRemainderMisalignment) && bFixes && !aFixes) return 1;
        }

        // 5. Instance ID (Keep sequential for identical pens)
        return a.instanceId - b.instanceId;
    });

    return validCandidates[0];
};


// --- Planning Algorithms ---

export const calculateInventoryOnlyPlan = (
  inventory: Pen[],
  maxDose: number,
  allowMicrodose: boolean,
  progressiveDosingOptions: { startDose: number; minWeeks: number } | null,
  config: BrandConfig
): PlanResult => {
  if (inventory.length === 0) {
      const steps = [{ isError: true, suggestion: "庫存為空，無法規劃。", weekRange: "N/A", weeklyDose: 0, penType: 0, weeksForPen: 0, totalMgUsed: 0, remainingMg: 0, notes: ["錯誤"] }];
      return { steps, summary: createSummary(steps, inventory, config) };
  }

  // --- Goal-Oriented Progressive Dosing Logic ---
  if (progressiveDosingOptions) {
      const { startDose, minWeeks } = progressiveDosingOptions;
      let steps: PlanStep[] = [];
      const penInstances = flattenInventory(inventory, config); 
      
      let weekCounter = 1;
      let currentDose = startDose;

      const allPossibleDoses = new Set<number>();
      penInstances.forEach(p => getAvailableDoses(p.type, maxDose, allowMicrodose, config).forEach(d => allPossibleDoses.add(d)));
      const sortedDoses = Array.from(allPossibleDoses).sort((a,b)=> a-b);

      let initialNote: string | null = null;
      if (!sortedDoses.some(d => Math.abs(d - startDose) < 0.01)) {
          const newStartDose = sortedDoses.find(d => d >= startDose);
          if (newStartDose) {
              currentDose = newStartDose;
              initialNote = `起始 ${startDose}${config.unit} 無庫存，從 ${currentDose}${config.unit} 開始`;
          } else {
              const steps = [{ isError: true, suggestion: `庫存不足以提供 ${startDose}${config.unit} 起始劑量。`, weekRange: "N/A", weeklyDose: 0, penType: 0, weeksForPen: 0, totalMgUsed: 0, remainingMg: 0, notes: ["錯誤"] }];
              return { steps, summary: createSummary(steps, inventory, config) };
          }
      }

      // 2. Titration Phase
      let peakDose = currentDose;
      while (currentDose <= maxDose) {
          const totalPotentialMg = penInstances.reduce((acc, p) => {
             if (getAvailableDoses(p.type, maxDose, allowMicrodose, config).includes(currentDose)) {
                 return acc + p.remainingCapacity;
             }
             return acc;
          }, 0);
          
          const totalPotentialWeeks = Math.floor(totalPotentialMg / currentDose);
          if (totalPotentialWeeks < 1) break;
          
          let weeksPlannedInStep = 0;
          
          while (weeksPlannedInStep < minWeeks) {
              const bestPen = findBestPenForDose(penInstances, currentDose, maxDose, allowMicrodose, config);
              if (!bestPen) break; 

              const maxWeeksFromPen = Math.floor(bestPen.remainingCapacity / currentDose);
              const weeksToTake = Math.min(maxWeeksFromPen, minWeeks - weeksPlannedInStep);

              if (weeksToTake > 0) {
                  const mgUsed = weeksToTake * currentDose;
                  bestPen.remainingCapacity -= mgUsed;
                  const notes = [];
                  if(allowMicrodose && bestPen.type !== currentDose) notes.push('Microdose');
                  if(initialNote) {
                    notes.unshift(initialNote);
                    initialNote = null;
                  }
                  
                  const clicks = calculateClicks(currentDose, bestPen.type, config);

                  steps.push({
                      weekRange: `第 ${weekCounter} - ${weekCounter + weeksToTake - 1} 週`,
                      weeklyDose: currentDose, penType: bestPen.type, weeksForPen: weeksToTake,
                      totalMgUsed: mgUsed, remainingMg: bestPen.remainingCapacity,
                      suggestion: bestPen.remainingCapacity > 0.1 ? '尚有餘量' : '已用盡',
                      notes,
                      microdoseClicks: clicks,
                      instanceId: bestPen.instanceId // Pass physical pen ID
                  });
                  weekCounter += weeksToTake;
                  weeksPlannedInStep += weeksToTake;
              } else {
                  break; 
              }
          }

          peakDose = currentDose;
          const nextHigherDose = sortedDoses.find(d => d > currentDose + 0.01);
          if (nextHigherDose) {
              currentDose = nextHigherDose;
          } else {
              break;
          }
      }

      // 3. Maintenance Phase
      while (true) {
          const bestPen = findBestPenForDose(penInstances, peakDose, maxDose, allowMicrodose, config);
          if (!bestPen) break;

          const weeksFromThisPen = Math.floor(bestPen.remainingCapacity / peakDose);
          if (weeksFromThisPen > 0) {
              const mgUsed = weeksFromThisPen * peakDose;
              bestPen.remainingCapacity -= mgUsed;
              const notes = [`維持期`];
              if (allowMicrodose && bestPen.type !== peakDose) notes.push('Microdose');
              
              const clicks = calculateClicks(peakDose, bestPen.type, config);

              steps.push({
                  weekRange: `第 ${weekCounter} - ${weekCounter + weeksFromThisPen - 1} 週`,
                  weeklyDose: peakDose, penType: bestPen.type, weeksForPen: weeksFromThisPen,
                  totalMgUsed: mgUsed, remainingMg: bestPen.remainingCapacity,
                  suggestion: bestPen.remainingCapacity > 0.1 ? '尚有餘量' : '已用盡',
                  notes,
                  microdoseClicks: clicks,
                  instanceId: bestPen.instanceId
              });
              weekCounter += weeksFromThisPen;
          } else {
               break; 
          }
      }

      // 4. Final Clearance Phase
      const remainingPens = penInstances.filter(p => p.remainingCapacity > 0.1).sort((a,b) => b.type - a.type);
      
      for (const pen of remainingPens) {
          const availableDoses = getAvailableDoses(pen.type, maxDose, allowMicrodose, config);
          if (availableDoses.length === 0) continue;
          
          let bestDose = 0;
          for (const dose of availableDoses) {
            if (pen.remainingCapacity >= dose) {
              bestDose = dose;
              break;
            }
          }

          if (bestDose > 0) {
            const weeksForPen = Math.floor(pen.remainingCapacity / bestDose);
            if (weeksForPen > 0) {
                const mgUsed = weeksForPen * bestDose;
                pen.remainingCapacity -= mgUsed;
                const notes = ['尾數出清'];
                if (allowMicrodose && pen.type !== bestDose) notes.push('Microdose');
                
                const clicks = calculateClicks(bestDose, pen.type, config);

                steps.push({
                    weekRange: `第 ${weekCounter} - ${weekCounter + weeksForPen - 1} 週`,
                    weeklyDose: bestDose, penType: pen.type, weeksForPen: weeksForPen,
                    totalMgUsed: mgUsed, remainingMg: pen.remainingCapacity,
                    suggestion: pen.remainingCapacity > 0.1 ? `剩餘 ${pen.remainingCapacity.toFixed(2)}mg` : '已用盡', notes,
                    microdoseClicks: clicks,
                    instanceId: pen.instanceId
                });
                weekCounter += weeksForPen;
            }
          }
      }
      
      if (steps.length === 0) {
          steps.push({ isError: true, suggestion: "根據設定，找不到可行的漸進式療程規劃。", weekRange: "N/A", weeklyDose: 0, penType: 0, weeksForPen: 0, totalMgUsed: 0, remainingMg: 0, notes: ["錯誤"] });
      } else {
        steps = consolidateSteps(steps);
      }

      return { steps, summary: createSummary(steps, inventory, config) };
  }

  // --- Legacy Inventory Only (Not Progressive) ---
  else {
      let steps: PlanStep[] = [];
      const penInstances = flattenInventory(inventory, config).sort((a, b) => a.type - b.type);
      let weekCounter = 1;

      for (const pen of penInstances) {
          const availableDoses = getAvailableDoses(pen.type, maxDose, allowMicrodose, config);
          if (availableDoses.length === 0) {
              steps.push({
                  weekRange: `第 ${weekCounter} 週起`, weeklyDose: 0, penType: pen.type, weeksForPen: 0, totalMgUsed: 0, remainingMg: pen.remainingCapacity, suggestion: `此筆型 (${pen.type}${config.unit}) 無法提供低於 ${maxDose}${config.unit} 的劑量。`, notes: ['無法施打'], isError: true, instanceId: pen.instanceId
              });
              continue;
          }

          const bestDose = availableDoses[0];
          const weeksForPen = Math.floor(pen.remainingCapacity / bestDose);
          if (weeksForPen === 0) continue;

          const totalMgUsed = weeksForPen * bestDose;
          const remainingMg = pen.remainingCapacity - totalMgUsed;
          pen.remainingCapacity = remainingMg;
          const notes = [];
          if (allowMicrodose && pen.type !== bestDose) {
              notes.push('Microdose');
          }

          const clicks = calculateClicks(bestDose, pen.type, config);

          steps.push({
              weekRange: `第 ${weekCounter} - ${weekCounter + weeksForPen - 1} 週`,
              weeklyDose: bestDose, penType: pen.type, weeksForPen, totalMgUsed, remainingMg,
              suggestion: remainingMg > 0.1 ? `剩餘 ${remainingMg.toFixed(2)}${config.unit}` : '已用盡',
              notes,
              microdoseClicks: clicks,
              instanceId: pen.instanceId
          });
          weekCounter += weeksForPen;
      }
       if (steps.length > 0) {
        steps = consolidateSteps(steps);
      }
      return { steps, summary: createSummary(steps, inventory, config) };
  }
};

export const calculateLadderPlan = (
  inventory: Pen[],
  maxDose: number,
  allowMicrodose: boolean,
  config: BrandConfig
): PlanResult => {
  let steps: PlanStep[] = [];
  const penInstances = flattenInventory(inventory, config);
  
  let weekCounter = 1;

  if (penInstances.length === 0) {
    steps.push({ isError: true, suggestion: "庫存為空，無法規劃。", weekRange: "N/A", weeklyDose: 0, penType: 0, weeksForPen: 0, totalMgUsed: 0, remainingMg: 0, notes: ["錯誤"] });
    return { steps, summary: createSummary(steps, inventory, config) };
  }

  const ladder = config.standardLadder.filter(d => d <= maxDose);

  for (const ladderDose of ladder) {
    let weeksToGo = LADDER_STEP_WEEKS;
    
    while (weeksToGo > 0) {
        const bestPen = findBestPenForDose(penInstances, ladderDose, maxDose, allowMicrodose, config);
        
        if (bestPen) {
            const weeksFromThisPen = Math.min(weeksToGo, Math.floor(bestPen.remainingCapacity / ladderDose));
            if (weeksFromThisPen > 0) {
                const mgUsedFromThisPen = weeksFromThisPen * ladderDose;
                bestPen.remainingCapacity -= mgUsedFromThisPen;
                
                const notes = [];
                if (allowMicrodose && bestPen.type !== ladderDose) notes.push('Microdose');

                const clicks = calculateClicks(ladderDose, bestPen.type, config);

                steps.push({
                    weekRange: `第 ${weekCounter} - ${weekCounter + weeksFromThisPen - 1} 週`,
                    weeklyDose: ladderDose, penType: bestPen.type, weeksForPen: weeksFromThisPen,
                    totalMgUsed: mgUsedFromThisPen, remainingMg: bestPen.remainingCapacity,
                    suggestion: bestPen.remainingCapacity > 0.1 ? '尚有餘量' : '已用盡', notes,
                    microdoseClicks: clicks,
                    instanceId: bestPen.instanceId
                });

                weekCounter += weeksFromThisPen;
                weeksToGo -= weeksFromThisPen;
            } else {
                break;
            }
        } else {
            steps.push({
                weekRange: `第 ${weekCounter} 週起`, weeklyDose: ladderDose, penType: 0, weeksForPen: 0, totalMgUsed: 0, remainingMg: 0, suggestion: `庫存中無筆可提供 ${ladderDose}${config.unit} 劑量。療程中斷。`, notes: ['需額外筆型'], isError: true
            });
            steps = consolidateSteps(steps);
            return { steps, summary: createSummary(steps, inventory, config) };
        }
    }
  }

  // Maintenance phase
  const maintenanceDose = ladder[ladder.length - 1] || maxDose;
  while(true) {
    const bestPen = findBestPenForDose(penInstances, maintenanceDose, maxDose, allowMicrodose, config);
    if (!bestPen) break;

    const weeksForPen = Math.floor(bestPen.remainingCapacity / maintenanceDose);
    if (weeksForPen > 0) {
      const totalMgUsed = weeksForPen * maintenanceDose;
      bestPen.remainingCapacity -= totalMgUsed;
      
      const notes = [`維持期`];
      if (allowMicrodose && bestPen.type !== maintenanceDose) notes.push('Microdose');
      
      const clicks = calculateClicks(maintenanceDose, bestPen.type, config);

      steps.push({
        weekRange: `第 ${weekCounter} - ${weekCounter + weeksForPen - 1} 週`,
        weeklyDose: maintenanceDose, penType: bestPen.type, weeksForPen, totalMgUsed,
        remainingMg: bestPen.remainingCapacity,
        suggestion: bestPen.remainingCapacity > 0.1 ? '尚有餘量' : '已用盡',
        notes,
        microdoseClicks: clicks,
        instanceId: bestPen.instanceId
      });
      weekCounter += weeksForPen;
    } else {
        break;
    }
  }

  if (steps.length > 0) {
    steps = consolidateSteps(steps);
  }
  return { steps, summary: createSummary(steps, inventory, config) };
};
