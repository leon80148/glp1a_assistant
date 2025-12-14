
import React from 'react';
import { PlanningMode, BrandConfig } from '../types';

interface SettingsProps {
  planningMode: PlanningMode;
  setPlanningMode: (mode: PlanningMode) => void;
  allowMicrodose: boolean;
  setAllowMicrodose: (allow: boolean) => void;
  maxDose: number;
  setMaxDose: (dose: number) => void;
  useProgressiveDosing: boolean;
  setUseProgressiveDosing: (use: boolean) => void;
  startDose: number;
  setStartDose: (dose: number) => void;
  minWeeksPerStep: number;
  setMinWeeksPerStep: (weeks: number) => void;
  isMicrodoseRequired: boolean;
  config: BrandConfig;
}

export const Settings: React.FC<SettingsProps> = ({
  planningMode,
  setPlanningMode,
  allowMicrodose,
  setAllowMicrodose,
  maxDose,
  setMaxDose,
  useProgressiveDosing,
  setUseProgressiveDosing,
  startDose,
  setStartDose,
  minWeeksPerStep,
  setMinWeeksPerStep,
  isMicrodoseRequired,
  config
}) => {
  const themeClass = config.themeColor === 'emerald' ? 'emerald' : 'cyan';

  const Toggle = ({ label, checked, onChange, disabled = false, description = "" }: any) => (
    <div className={`flex items-start justify-between py-3 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <div className="flex flex-col mr-4">
            <span className={`text-sm font-bold ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>{label}</span>
            {description && <span className="text-[11px] text-slate-500 mt-0.5 leading-tight">{description}</span>}
        </div>
        <button
            type="button"
            disabled={disabled}
            className={`${checked ? `bg-${themeClass}-600` : 'bg-slate-300'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-${themeClass}-500 focus:ring-offset-2`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <span className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200/60">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className={`bg-${themeClass}-100 p-1.5 rounded-lg`}>
                <svg className={`w-5 h-5 text-${themeClass}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </span>
            參數設定
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Mode Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">規劃策略</label>
          <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => setPlanningMode(PlanningMode.InventoryOnly)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${planningMode === PlanningMode.InventoryOnly ? `border-${themeClass}-500 bg-${themeClass}-50/50 ring-1 ring-${themeClass}-500 shadow-sm` : `border-slate-200 hover:border-${themeClass}-300 hover:bg-slate-50`}`}
            >
                {planningMode === PlanningMode.InventoryOnly && <div className={`absolute top-0 right-0 w-3 h-3 bg-${themeClass}-500 rounded-bl-lg`}></div>}
                <div className={`font-bold text-sm ${planningMode === PlanningMode.InventoryOnly ? `text-${themeClass}-800` : 'text-slate-700'}`}>庫存優先</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">根據現有庫存量身打造，目標是清空庫存</div>
            </button>
            <button 
                onClick={() => setPlanningMode(PlanningMode.StandardLadder)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${planningMode === PlanningMode.StandardLadder ? `border-${themeClass}-500 bg-${themeClass}-50/50 ring-1 ring-${themeClass}-500 shadow-sm` : `border-slate-200 hover:border-${themeClass}-300 hover:bg-slate-50`}`}
            >
                {planningMode === PlanningMode.StandardLadder && <div className={`absolute top-0 right-0 w-3 h-3 bg-${themeClass}-500 rounded-bl-lg`}></div>}
                <div className={`font-bold text-sm ${planningMode === PlanningMode.StandardLadder ? `text-${themeClass}-800` : 'text-slate-700'}`}>標準階梯</div>
                <div className="text-[10px] text-slate-500 mt-1 leading-tight">嚴格遵循標準升級階梯，缺藥時中斷</div>
            </button>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Inventory Only Settings */}
        {planningMode === PlanningMode.InventoryOnly && (
            <div className="space-y-4">
                <Toggle 
                    label="漸進式劑量 (Titration)" 
                    description="從低劑量開始，逐步增加至目標，更符合醫療指引"
                    checked={useProgressiveDosing} 
                    onChange={setUseProgressiveDosing} 
                />
                
                <div className={`grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 transition-opacity duration-300 ${useProgressiveDosing ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">起始劑量</label>
                        <div className="relative">
                            <select
                                value={startDose}
                                onChange={(e) => setStartDose(Number(e.target.value))}
                                className={`block w-full appearance-none rounded-lg border-slate-300 bg-white py-2 pl-3 pr-8 text-sm shadow-sm focus:border-${themeClass}-500 focus:outline-none focus:ring-1 focus:ring-${themeClass}-500 font-medium text-slate-700`}
                            >
                                {config.penTypes.map(type => (
                                    <option key={type} value={type}>{type} mg</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">每階維持</label>
                        <div className="flex items-center">
                            <input
                                type="number"
                                min="1"
                                value={minWeeksPerStep}
                                onChange={(e) => setMinWeeksPerStep(Math.max(1, Number(e.target.value)))}
                                className={`block w-full rounded-lg border-slate-300 bg-white py-2 px-3 text-sm shadow-sm focus:border-${themeClass}-500 focus:outline-none focus:ring-1 focus:ring-${themeClass}-500 font-medium text-slate-700`}
                            />
                            <span className="ml-2 text-xs text-slate-400 font-medium">週</span>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <hr className="border-slate-100" />

        {/* Global Settings */}
        <div className="space-y-5">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">最大劑量上限</label>
                <div className="relative">
                    <select
                        value={maxDose}
                        onChange={(e) => setMaxDose(Number(e.target.value))}
                        className={`block w-full appearance-none rounded-lg border-slate-300 bg-white py-2.5 pl-3 pr-10 shadow-sm focus:border-${themeClass}-500 focus:outline-none focus:ring-1 focus:ring-${themeClass}-500 text-slate-700 font-medium`}
                    >
                        {config.penTypes.map(type => (
                            <option key={type} value={type}>{type} mg / 週</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
            </div>

            <Toggle 
                label="允許 Microdosing" 
                description={isMicrodoseRequired ? "起始劑量小於庫存最小筆型，系統自動強制啟用" : "允許大容量筆轉出小劑量 (如 5mg 筆打 2.5mg)"}
                checked={allowMicrodose} 
                onChange={setAllowMicrodose}
                disabled={isMicrodoseRequired}
            />
        </div>
      </div>
    </div>
  );
};
