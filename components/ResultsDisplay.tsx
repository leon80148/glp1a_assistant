
import React, { useState, useEffect } from 'react';
import { PlanResult, PlanStep } from '../types';

interface ResultsDisplayProps {
  result: PlanResult | null;
  isLoading: boolean;
}

const Alert: React.FC<{ type: 'info' | 'success' | 'danger', children: React.ReactNode }> = ({ type, children }) => {
    const styles = {
        info: "bg-sky-50 border-sky-200 text-sky-800",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
        danger: "bg-rose-50 border-rose-200 text-rose-800",
    };
    return (
        <div className={`p-4 rounded-xl border ${styles[type]} flex gap-3 items-start shadow-sm`}>
            <div className="mt-0.5 shrink-0">
                {type === 'danger' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                {type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                {type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            </div>
            <div className="text-sm font-medium leading-relaxed">{children}</div>
        </div>
    );
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, isLoading }) => {
  const [editableSteps, setEditableSteps] = useState<PlanStep[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync local state with props when result changes
  useEffect(() => {
    if (result) {
      setEditableSteps(result.steps);
    }
  }, [result]);

  const handlePrint = () => {
    window.print();
  };

  // Re-calculate week ranges globally based on the sequence of steps across all pens
  const recalculateWeeks = (steps: PlanStep[]): PlanStep[] => {
    let currentWeek = 1;
    return steps.map(step => {
      if (step.isError) return step;
      const start = currentWeek;
      const end = currentWeek + step.weeksForPen - 1;
      currentWeek += step.weeksForPen;
      return {
        ...step,
        weekRange: `第 ${start} - ${end} 週`
      };
    });
  };

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    
    const ghost = document.createElement('div');
    ghost.classList.add('bg-cyan-600', 'text-white', 'px-4', 'py-2', 'rounded-lg', 'font-bold', 'text-sm');
    ghost.textContent = `移動中: ${editableSteps[index].weeklyDose}mg 方案`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    // Restrict DND to same Pen Instance
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Check if target and source share the same instanceId
    if (editableSteps[draggedIndex].instanceId !== editableSteps[index].instanceId) return;

    setDragOverIndex(index);
  };

  const onDragLeave = () => {
    setDragOverIndex(null);
  };

  const onDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === targetIndex) return;

    // Security check: Ensure same instance
    if (editableSteps[draggedIndex].instanceId !== editableSteps[targetIndex].instanceId) return;

    const sourceStep = editableSteps[draggedIndex];
    const targetStep = editableSteps[targetIndex];
    
    const newSteps = [...editableSteps];

    // MERGE LOGIC: Check if compatible
    const isCompatible = 
        sourceStep.weeklyDose === targetStep.weeklyDose && 
        sourceStep.penType === targetStep.penType &&
        sourceStep.instanceId === targetStep.instanceId; // Redundant but safe

    if (isCompatible) {
        // Merge Source into Target
        const mergedStep: PlanStep = {
            ...targetStep,
            weeksForPen: targetStep.weeksForPen + sourceStep.weeksForPen,
            totalMgUsed: targetStep.totalMgUsed + sourceStep.totalMgUsed,
            remainingMg: sourceStep.remainingMg, 
            notes: Array.from(new Set([...targetStep.notes, ...sourceStep.notes, '已合併'])),
            suggestion: sourceStep.suggestion, 
            microdoseClicks: sourceStep.microdoseClicks 
        };

        // Replace target with merged, remove source
        // CAREFUL: Indices change after splice. 
        // If dragged is AFTER target, removing dragged doesn't affect target index.
        // If dragged is BEFORE target, target index shifts down by 1.
        
        if (draggedIndex > targetIndex) {
            newSteps[targetIndex] = mergedStep;
            newSteps.splice(draggedIndex, 1);
        } else {
            newSteps.splice(draggedIndex, 1); // Remove source first
            newSteps[targetIndex - 1] = mergedStep; // Target index shifted
        }

    } else {
        // Standard Reorder (Swap)
        const [movedItem] = newSteps.splice(draggedIndex, 1);
        newSteps.splice(targetIndex, 0, movedItem);
    }

    setEditableSteps(recalculateWeeks(newSteps));
    setDraggedIndex(null);
  };
  
  // Group steps by instanceId for rendering
  const groupedSteps: { instanceId: number | undefined, penType: number, steps: PlanStep[], startIndex: number }[] = [];
  let currentGroup: PlanStep[] = [];
  let currentInstanceId: number | undefined = undefined;
  let currentPenType = 0;
  let groupStartIndex = 0;

  editableSteps.forEach((step, index) => {
      if (step.instanceId !== currentInstanceId && currentGroup.length > 0) {
          groupedSteps.push({ instanceId: currentInstanceId, penType: currentPenType, steps: currentGroup, startIndex: groupStartIndex });
          currentGroup = [];
          groupStartIndex = index;
      }
      if (currentGroup.length === 0) {
          currentInstanceId = step.instanceId;
          currentPenType = step.penType;
          groupStartIndex = index;
      }
      currentGroup.push(step);
  });
  if (currentGroup.length > 0) {
      groupedSteps.push({ instanceId: currentInstanceId, penType: currentPenType, steps: currentGroup, startIndex: groupStartIndex });
  }

  if (isLoading) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-6 text-slate-700 font-bold text-lg">正在計算最佳劑量路徑...</p>
      </div>
    );
  }
  
  if (!result) {
    return (
      <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white/50 rounded-2xl shadow-inner border border-slate-100 p-8 text-center backdrop-blur-sm">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md">
            <svg className="h-12 w-12 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-700">等待產生規劃</h3>
        <p className="mt-2 text-slate-500 max-w-xs mx-auto">請在左側設定庫存與參數，系統將為您計算最省藥的療程方案。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="print-section">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex flex-col hover:shadow-lg transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">總療程週數</span>
            <div className="mt-auto flex items-baseline gap-1">
                <span className="text-3xl font-bold text-cyan-600">{editableSteps.reduce((acc, s) => acc + s.weeksForPen, 0)}</span>
                <span className="text-sm text-slate-500 font-medium">週</span>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex flex-col hover:shadow-lg transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">預估浪費</span>
            <div className="mt-auto flex items-baseline gap-1">
                <span className={`text-3xl font-bold ${result.summary.totalWasteMg === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {result.summary.totalWasteMg.toFixed(1)}
                </span>
                <span className="text-sm text-slate-500 font-medium">mg</span>
            </div>
        </div>
         <div className="bg-white p-5 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex flex-col hover:shadow-lg transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">藥物利用率</span>
            <div className="mt-auto flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-700">{(100 - result.summary.wasteRate).toFixed(1)}</span>
                <span className="text-sm text-slate-500 font-medium">%</span>
            </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-shadow">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">消耗筆數</span>
            <div className="flex flex-wrap gap-1.5">
                {result.summary.penUsage.map(p => (
                    <span key={p.type} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                        {p.type}mg ×{p.used}
                    </span>
                ))}
                {result.summary.penUsage.length === 0 && <span className="text-sm text-slate-400">-</span>}
            </div>
        </div>
      </div>

      {/* Alert */}
      <div className="no-print">
        <Alert type="info">
            <div className="flex flex-col gap-1">
                <span className="font-bold">排程編輯說明</span>
                <span className="text-xs opacity-90">療程已依照「實體注射筆」分區。您可以在<strong className="text-sky-700">同一支筆的區塊內</strong>拖曳合併劑量，但無法跨筆移動，以確保使用順序正確。</span>
            </div>
        </Alert>
      </div>

      {/* Main Schedule List Grouped by Pen */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-slate-800">療程排程表</h2>
             <button onClick={handlePrint} className="no-print group flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-cyan-400 hover:text-cyan-600 hover:shadow-md transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                <span className="hidden sm:inline">列印報表</span>
            </button>
         </div>

         {groupedSteps.map((group, groupIndex) => (
             <div key={group.instanceId ?? groupIndex} className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden">
                {/* Pen Header */}
                <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shadow-sm">
                        {groupIndex + 1}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-700 text-sm">第 {groupIndex + 1} 支注射筆</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            {group.penType > 0 ? `${group.penType} mg` : '未定'} 規格
                        </p>
                    </div>
                    <div className="ml-auto text-[10px] text-slate-400 font-mono border border-slate-200 px-2 py-1 rounded bg-white">
                         ID: #{group.instanceId}
                    </div>
                </div>

                {/* Steps List */}
                <div className="p-2 bg-slate-50/30">
                    {group.steps.map((step, stepIndex) => {
                        const absoluteIndex = group.startIndex + stepIndex;
                        const isBeingDragged = draggedIndex === absoluteIndex;
                        const isDragOver = dragOverIndex === absoluteIndex;
                        const isCompatibleForMerge = draggedIndex !== null && draggedIndex !== absoluteIndex && 
                            editableSteps[draggedIndex].weeklyDose === step.weeklyDose && 
                            editableSteps[draggedIndex].penType === step.penType &&
                            editableSteps[draggedIndex].instanceId === step.instanceId;

                        let borderClass = "border-slate-200";
                        let bgClass = "bg-white";
                        
                        if (isBeingDragged) {
                            bgClass = "bg-cyan-50 opacity-50";
                            borderClass = "border-cyan-300 dashed border-2";
                        } else if (isDragOver) {
                            if (isCompatibleForMerge) {
                                bgClass = "bg-emerald-50";
                                borderClass = "border-emerald-400 ring-2 ring-emerald-200 z-10 scale-[1.01]";
                            } else if (editableSteps[draggedIndex!].instanceId === step.instanceId) {
                                bgClass = "bg-cyan-50";
                                borderClass = "border-cyan-400";
                            }
                        }

                        return (
                            <div
                                key={absoluteIndex}
                                draggable={!step.isError}
                                onDragStart={(e) => onDragStart(e, absoluteIndex)}
                                onDragOver={(e) => onDragOver(e, absoluteIndex)}
                                onDragLeave={onDragLeave}
                                onDrop={(e) => onDrop(e, absoluteIndex)}
                                className={`relative grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-4 mb-2 rounded-xl border shadow-sm transition-all duration-200 ${bgClass} ${borderClass} ${!step.isError ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : 'opacity-70'}`}
                            >
                                {/* Drag Handle */}
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 no-print cursor-grab md:block hidden">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16"></path></svg>
                                </div>

                                {/* Columns */}
                                <div className="col-span-1 md:col-span-3 md:pl-8 flex items-center">
                                    <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">{step.weekRange}</span>
                                </div>
                                
                                <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                                    <span className="text-xs md:hidden text-slate-400 font-bold uppercase">劑量:</span>
                                    <div className="flex items-baseline">
                                        <span className="text-lg font-bold text-cyan-700">{step.weeklyDose}</span>
                                        <span className="text-xs text-slate-400 ml-1">mg</span>
                                    </div>
                                </div>

                                <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                                    <span className="text-xs md:hidden text-slate-400 font-bold uppercase">時長:</span>
                                    <span className="text-sm font-bold text-slate-700">{step.weeksForPen} <span className="text-slate-400 text-xs font-normal">週</span></span>
                                </div>

                                <div className="col-span-1 md:col-span-4 flex flex-col justify-center">
                                    <div className="flex flex-wrap gap-2 mb-1">
                                        {step.notes.map((note, i) => {
                                            let badgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                                            if(note.includes('Microdose')) badgeClass = "bg-purple-50 text-purple-700 border-purple-200";
                                            if(note.includes('維持')) badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                            if(note.includes('出清') || note.includes('尾數')) badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                                            if(note.includes('合併')) badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
                                            if(note.includes('無法') || note.includes('錯誤')) badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                                            
                                            return <span key={i} className={`px-2 py-0.5 text-[11px] rounded-md font-bold border ${badgeClass}`}>{note}</span>
                                        })}
                                        {step.microdoseClicks !== undefined && step.microdoseClicks > 0 && (
                                            <span className="px-2 py-0.5 text-[11px] rounded-md font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                                轉 {step.microdoseClicks} 格
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        {step.remainingMg < 0.1 ? (
                                            <span className="text-slate-300">本區塊已用盡</span>
                                        ) : (
                                            <span className="text-amber-600 font-medium">區塊剩餘 {step.remainingMg.toFixed(1)} mg</span>
                                        )}
                                        
                                        {isCompatibleForMerge && isDragOver && (
                                            <span className="ml-auto text-emerald-600 font-bold animate-pulse flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                                放開以合併
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
         ))}
      </div>
    </div>
  );
};
