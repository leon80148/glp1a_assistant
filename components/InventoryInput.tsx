
import React from 'react';
import { Pen, BrandConfig } from '../types';

interface InventoryInputProps {
  inventory: Pen[];
  setInventory: React.Dispatch<React.SetStateAction<Pen[]>>;
  config: BrandConfig;
}

export const InventoryInput: React.FC<InventoryInputProps> = ({ inventory, setInventory, config }) => {
  
  const handleAddPen = (type: number) => {
    const existingPen = inventory.find(p => p.type === type);
    if (existingPen) {
      setInventory(inventory.map(p => 
        p.type === type ? { ...p, quantity: p.quantity + 1 } : p
      ));
    } else {
      setInventory([...inventory, { id: Date.now().toString(), type: type, quantity: 1 }].sort((a,b) => a.type - b.type));
    }
  };

  const handleRemovePen = (id: string) => {
    setInventory(inventory.filter(pen => pen.id !== id));
  };
  
  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity >= 0) {
        if (newQuantity === 0) {
            handleRemovePen(id);
        } else {
            setInventory(inventory.map(pen => pen.id === id ? {...pen, quantity: newQuantity} : pen));
        }
    }
  };

  const totalPens = inventory.reduce((acc, p) => acc + p.quantity, 0);
  const totalMg = inventory.reduce((acc, p) => acc + (p.quantity * p.type * config.capacityMultiplier), 0);

  const themeClass = config.themeColor === 'emerald' ? 'emerald' : 'cyan';
  const blueClass = config.themeColor === 'emerald' ? 'emerald' : 'blue';

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/60">
      <div className={`bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200/60 flex justify-between items-center`}>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className={`bg-${blueClass}-100 p-1.5 rounded-lg`}>
                <svg className={`w-5 h-5 text-${blueClass}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </span>
            庫存管理
        </h2>
        <div className="text-xs font-bold px-2 py-1 bg-white rounded-md border border-slate-200 text-slate-600 shadow-sm">
            總藥量: {totalMg.toFixed(2)} mg
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">點擊新增注射筆 ({config.name})</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {config.penTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => handleAddPen(type)}
                        className={`flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-xl hover:border-${themeClass}-400 hover:bg-${themeClass}-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 group`}
                    >
                        <span className={`text-sm font-bold text-slate-700 group-hover:text-${themeClass}-700`}>{type}</span>
                        <span className={`text-[10px] text-slate-400 group-hover:text-${themeClass}-600/70`}>mg</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
            {inventory.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar space-y-3">
                    {inventory.map((pen) => (
                    <div key={pen.id} className={`flex items-center justify-between bg-slate-50/80 p-3 rounded-xl border border-slate-200 hover:border-${themeClass}-300 hover:bg-white transition-all group`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${themeClass}-100 to-${blueClass}-100 flex items-center justify-center text-${blueClass}-700 font-bold text-sm shadow-inner`}>
                                {pen.type}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-sm">{pen.type} mg 筆</span>
                                <span className="text-[10px] text-slate-400 font-medium">總容量 {(pen.type * config.capacityMultiplier).toFixed(1)} mg</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm group-hover:border-${themeClass}-200`}>
                                <button 
                                    onClick={() => handleQuantityChange(pen.id, pen.quantity - 1)}
                                    className="px-3 py-1 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
                                >-</button>
                                <div className="w-10 text-center text-sm font-bold text-slate-700 border-x border-slate-100 py-1">
                                    {pen.quantity}
                                </div>
                                <button 
                                    onClick={() => handleQuantityChange(pen.id, pen.quantity + 1)}
                                    className={`px-3 py-1 hover:bg-${themeClass}-50 hover:text-${themeClass}-600 text-slate-400 transition-colors`}
                                >+</button>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <div className="text-slate-300 mb-2">
                        <svg className="w-10 h-10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">目前沒有庫存</p>
                    <p className="text-slate-400 text-xs mt-1">請點擊上方按鈕新增您的注射筆</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
