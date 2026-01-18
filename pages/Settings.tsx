
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  onBack: () => void;
  onUpdateUser: (u: UserProfile) => void;
}

const Settings: React.FC<Props> = ({ onBack, onUpdateUser }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const resetApp = () => {
      localStorage.clear();
      window.location.reload();
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-white mr-4">
          <span className="text-2xl">←</span>
        </button>
        <h1 className="text-2xl font-black text-white">Settings</h1>
      </div>

      <div className="space-y-6">
          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
              <h2 className="text-amber-500 font-black text-xs uppercase mb-4 tracking-widest">Custom Awards</h2>
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="font-bold text-white">MVP Award</p>
                          <p className="text-xs text-slate-500">Temba Bavuma Award</p>
                      </div>
                      <button className="text-amber-500 text-xs font-bold">RENAME</button>
                  </div>
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="font-bold text-white">Worst Bowler</p>
                          <p className="text-xs text-slate-500">Dinda Academy Award</p>
                      </div>
                      <button className="text-amber-500 text-xs font-bold">RENAME</button>
                  </div>
                  <div className="flex justify-between items-center">
                      <div>
                          <p className="font-bold text-white">Duck Award</p>
                          <p className="text-xs text-slate-500">Babar-e-Azam Award</p>
                      </div>
                      <button className="text-amber-500 text-xs font-bold">RENAME</button>
                  </div>
              </div>
          </div>

          <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700">
              <h2 className="text-amber-500 font-black text-xs uppercase mb-4 tracking-widest">Academy Security</h2>
              <button className="w-full py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white font-bold mb-4">
                  CHANGE PIN
              </button>
              <button className="w-full py-4 bg-slate-900 border border-slate-700 rounded-2xl text-red-400 font-bold">
                  DISABLE LOCK
              </button>
          </div>

          <div className="pt-10">
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-4 bg-red-900/20 border-2 border-dashed border-red-500/50 rounded-2xl text-red-500 font-black"
              >
                  FACTORY RESET APP
              </button>
              <p className="text-center text-[10px] text-slate-600 mt-4 uppercase font-black tracking-widest">Version 1.0.0 • Local Only</p>
          </div>
      </div>

      {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-sm">
                  <h2 className="text-xl font-black text-white mb-2">Are you sure?</h2>
                  <p className="text-slate-400 text-sm mb-8">This will erase all academy records, matches, and players forever. This cannot be undone.</p>
                  <div className="flex flex-col gap-3">
                      <button onClick={resetApp} className="py-4 bg-red-600 text-white font-black rounded-2xl">ERASE EVERYTHING</button>
                      <button onClick={() => setShowResetConfirm(false)} className="py-4 text-slate-500 font-bold">CANCEL</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
