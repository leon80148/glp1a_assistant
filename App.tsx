
import React, { useState, useCallback, useEffect } from 'react';
import { InventoryInput } from './components/InventoryInput';
import { Settings } from './components/Settings';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Instructions } from './components/Instructions';
import { calculateInventoryOnlyPlan, calculateLadderPlan } from './services/planningService';
import { Pen, PlanningMode, PlanResult, Brand } from './types';
import { BRANDS } from './constants';

function App() {
  const [brand, setBrand] = useState<Brand>('mounjaro');
  const currentConfig = BRANDS[brand];

  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  const [inventory, setInventory] = useState<Pen[]>([
    { type: brand === 'mounjaro' ? 12.5 : 1.0, quantity: 1, id: '1' },
  ]);

  const [planningMode, setPlanningMode] = useState<PlanningMode>(PlanningMode.InventoryOnly);
  const [allowMicrodose, setAllowMicrodose] = useState<boolean>(true);
  const [maxDose, setMaxDose] = useState<number>(brand === 'mounjaro' ? 10 : 1.7);
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [useProgressiveDosing, setUseProgressiveDosing] = useState<boolean>(true);
  const [startDose, setStartDose] = useState<number>(brand === 'mounjaro' ? 2.5 : 0.25);
  const [minWeeksPerStep, setMinWeeksPerStep] = useState<number>(4);

  // Switch Brand Logic
  const handleBrandChange = (newBrand: Brand) => {
      if (newBrand === brand) return;
      
      setBrand(newBrand);
      const newConfig = BRANDS[newBrand];
      
      // Reset defaults for the new brand
      setInventory([]);
      setStartDose(newConfig.penTypes[0]);
      setMaxDose(newConfig.penTypes[newConfig.penTypes.length > 3 ? 3 : newConfig.penTypes.length - 1]);
      setPlanResult(null);
  };

  useEffect(() => {
    if (useProgressiveDosing) {
      const isStartDoseAvailableAsPen = inventory.some(pen => pen.type === startDose);
      if (!isStartDoseAvailableAsPen) {
        setAllowMicrodose(true);
      }
    }
  }, [startDose, inventory, useProgressiveDosing]);

  const handleGeneratePlan = useCallback(() => {
    setIsLoading(true);
    setPlanResult(null);
    
    setTimeout(() => {
      let result: PlanResult;
      if (planningMode === PlanningMode.InventoryOnly) {
        result = calculateInventoryOnlyPlan(inventory, maxDose, allowMicrodose, useProgressiveDosing ? { startDose, minWeeks: minWeeksPerStep } : null, currentConfig);
      } else {
        result = calculateLadderPlan(inventory, maxDose, allowMicrodose, currentConfig);
      }
      setPlanResult(result);
      setIsLoading(false);
    }, 400);
  }, [inventory, planningMode, allowMicrodose, maxDose, useProgressiveDosing, startDose, minWeeksPerStep, currentConfig]);

  const handleSetStartDose = (dose: number) => {
    setStartDose(dose);
    if (dose > maxDose) {
      setMaxDose(dose);
    }
  };
  
  const handleSetMaxDose = (dose: number) => {
    setMaxDose(dose);
    if (useProgressiveDosing && dose < startDose) {
      setStartDose(dose);
    }
  };

  // Dynamic Styles based on Brand
  const themeGradient = brand === 'mounjaro' 
    ? 'from-teal-600 via-cyan-600 to-blue-600' 
    : 'from-emerald-600 via-teal-600 to-cyan-600';
  
  const buttonGradient = brand === 'mounjaro'
    ? 'from-cyan-600 to-blue-600 shadow-blue-500/30 focus:ring-cyan-500'
    : 'from-emerald-600 to-teal-600 shadow-emerald-500/30 focus:ring-emerald-500';

  const Header = () => (
    <header className={`bg-gradient-to-r ${themeGradient} shadow-lg no-print transition-colors duration-500 relative overflow-hidden`}>
      <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center text-white w-full md:w-auto justify-center md:justify-start">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner hidden sm:block border border-white/10">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          </div>
          <div className="ml-3 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-none drop-shadow-md text-white">
              GLP-1 療程規劃助手
            </h1>
            <div className="mt-1.5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-xs md:text-sm font-medium text-blue-50">
                 <span className="opacity-90 tracking-wide">{currentConfig.name} 模式</span>
                 <span className="hidden sm:inline opacity-40">|</span>
                 <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-md border border-white/10 shadow-sm text-white font-bold tracking-wider">
                    作者：@fmdrlu
                 </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowInstructions(true)}
                className="text-white/80 hover:text-white font-bold text-sm flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all hover:bg-white/20 border border-white/5"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                使用說明
            </button>

            {/* Brand Switcher */}
            <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-sm border border-white/10">
                <button 
                    onClick={() => handleBrandChange('mounjaro')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${brand === 'mounjaro' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-blue-100 hover:bg-white/10'}`}
                >
                    猛健樂
                </button>
                <button 
                    onClick={() => handleBrandChange('wegovy')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${brand === 'wegovy' ? 'bg-white text-emerald-600 shadow-md scale-105' : 'text-emerald-100 hover:bg-white/10'}`}
                >
                    週纖達
                </button>
            </div>
        </div>
      </div>
    </header>
  );

  const isMicrodoseRequired = useProgressiveDosing && !inventory.some(pen => pen.type === startDose);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-cyan-100 selection:text-cyan-900 flex flex-col">
      
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center no-print">
        <div className="max-w-4xl mx-auto">
            <p className="text-amber-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            本工具僅供專業人員計算與參考使用，不構成任何醫療建議。如有任何疑問，請諮詢醫師或其他專業醫療人員。
            </p>
            <p className="text-amber-700/80 text-xs mt-1.5 leading-relaxed">
                猛健樂、週纖達等 GLP-1a 類藥物之藥品仿單均載有建議之標準療程。本工具主要用於患者因特殊狀況無法依循正常療程、需調整劑量時之輔助計算。
            </p>
        </div>
      </div>

      <Header />
      
      <Instructions config={currentConfig} isOpen={showInstructions} onClose={() => setShowInstructions(false)} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Left Sidebar: Inputs */}
        <div className="lg:col-span-4 space-y-6 no-print">
            
            <InventoryInput 
                inventory={inventory} 
                setInventory={setInventory} 
                config={currentConfig}
            />
            
            <Settings
            planningMode={planningMode}
            setPlanningMode={setPlanningMode}
            allowMicrodose={allowMicrodose}
            setAllowMicrodose={setAllowMicrodose}
            maxDose={maxDose}
            setMaxDose={handleSetMaxDose}
            useProgressiveDosing={useProgressiveDosing}
            setUseProgressiveDosing={setUseProgressiveDosing}
            startDose={startDose}
            setStartDose={handleSetStartDose}
            minWeeksPerStep={minWeeksPerStep}
            setMinWeeksPerStep={setMinWeeksPerStep}
            isMicrodoseRequired={isMicrodoseRequired}
            config={currentConfig}
            />

            <button
                onClick={handleGeneratePlan}
                disabled={inventory.length === 0 || isLoading}
                className={`group w-full bg-gradient-to-r ${buttonGradient} text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all duration-200 ease-out flex items-center justify-center`}
            >
                {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    正在計算最佳路徑...
                </>
                ) : (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    產生療程規劃
                </>
                )}
            </button>
        </div>
        
        {/* Right Content: Results */}
        <div className="lg:col-span-8 print-container">
            <ResultsDisplay result={planResult} isLoading={isLoading} />
        </div>
        </div>
      </main>

      {/* Footer for copyright/version */}
      <footer className="bg-slate-100 py-8 mt-auto border-t border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
                 <span className="bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-700 text-xs font-bold shadow-sm">
                    作者：@fmdrlu
                 </span>
            </div>
            <p className="text-slate-400 text-xs">
                本工具僅供技術展示與庫存規劃參考 • 藥物使用請遵照醫師指示
            </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
