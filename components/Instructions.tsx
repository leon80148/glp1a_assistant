
import React from 'react';
import { BrandConfig } from '../types';

interface InstructionsProps {
  config: BrandConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ config, isOpen, onClose }) => {
  if (!isOpen) return null;

  const themeClass = config.themeColor === 'emerald' ? 'text-emerald-600' : 'text-cyan-600';
  const themeBg = config.themeColor === 'emerald' ? 'bg-emerald-50' : 'bg-cyan-50';
  const themeBorder = config.themeColor === 'emerald' ? 'border-emerald-200' : 'border-cyan-200';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal Content */}
        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button type="button" onClick={onClose} className="bg-white rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors">
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
            
            {/* Header Icon */}
            <div className={`w-16 h-16 ${themeBg} rounded-full flex items-center justify-center mx-auto mb-4 mt-2`}>
                <svg className={`w-8 h-8 ${themeClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>

            {/* Main Content Section */}
            <div className="text-center mb-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-slate-800 mb-1" id="modal-title">GLP-1 療程規劃助手</h3>
                <p className="text-sm text-slate-500 font-medium mb-6">作者：@fmdrlu</p>
                
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-left shadow-sm">
                    
                    {/* Top Disclaimer */}
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5 text-amber-800 text-xs leading-relaxed font-medium">
                        猛健樂、週纖達等 GLP-1a 類藥物之藥品仿單均載有建議之標準療程。本工具主要用於患者因特殊狀況無法依循正常療程、需調整劑量時之輔助計算。
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed mb-4 font-medium">
                        <strong>GLP-1 療程規劃助手</strong> 是一款專為 <strong>Mounjaro (猛健樂)</strong> 與 <strong>Wegovy (週纖達)</strong> 設計的智慧庫存管理工具。
                    </p>
                    
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">核心功能與效益：</h4>
                    <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside marker:text-slate-300 mb-5 pl-1">
                        <li><strong className="text-slate-700">精準規劃：</strong>根據您現有的注射筆庫存，自動計算出最經濟、最省藥的每週施打計畫。</li>
                        <li><strong className="text-slate-700">Microdose 換算：</strong>內建「轉動格數 (Clicks)」計算器，讓非標準劑量的調整更精確簡單。</li>
                        <li><strong className="text-slate-700">視覺化管理：</strong>以「實體筆」為單位的排程介面，清楚掌握每一支筆的使用進度與殘餘量。</li>
                        <li><strong className="text-slate-700">靈活調整：</strong>支援拖曳合併功能，讓您在符合醫療邏輯的前提下，彈性微調每週劑量。</li>
                    </ul>

                    <p className="text-slate-500 text-xs pt-3 border-t border-slate-200 italic">
                        無論是專業醫療人員協助衛教，或使用者自我管理，都能透過此工具大幅減少計算錯誤與藥物浪費。
                    </p>

                    {/* Bottom Medical Disclaimer */}
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-center">
                         <p className="text-rose-700 text-xs font-bold">
                            本工具僅供專業人員計算與參考使用，不構成任何醫療建議。如有任何疑問，請諮詢醫師或其他專業醫療人員。
                         </p>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100 mb-6" />
            
            <h4 className="text-center text-slate-400 font-bold text-xs uppercase tracking-wider mb-4">快速上手指南</h4>

            {/* Steps Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-500 border border-slate-200 text-sm">1</div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">選擇藥物品牌</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">切換猛健樂或週纖達，系統會自動調整筆型與計算邏輯。</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-500 border border-slate-200 text-sm">2</div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">輸入現有庫存</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">點擊按鈕新增您手邊的注射筆。</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-500 border border-slate-200 text-sm">3</div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">設定療程參數</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">選擇「庫存優先」清空庫存，或「標準階梯」依指引升級。</p>
                    </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-500 border border-slate-200 text-sm">4</div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">檢視與調整</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">系統將自動計算轉格數(Microdose)與每週劑量。</p>
                    </div>
                </div>
            </div>

          </div>
          
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-100">
            <button type="button" onClick={onClose} className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r ${config.themeColor === 'emerald' ? 'from-emerald-600 to-teal-600' : 'from-cyan-600 to-blue-600'} text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm`}>
              我了解了，開始規劃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
