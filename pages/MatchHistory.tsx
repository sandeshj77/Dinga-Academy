
import React from 'react';
import { db } from '../db';
import { Match } from '../types';

interface Props {
  onBack: () => void;
  onSelectMatch: (m: Match) => void;
}

const MatchHistory: React.FC<Props> = ({ onBack, onSelectMatch }) => {
  const data = db.getData();

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-white mr-4">
          <span className="text-2xl">←</span>
        </button>
        <h1 className="text-2xl font-black text-white">Match Records</h1>
      </div>

      <div className="space-y-4">
          {data.matches.length === 0 ? (
              <div className="py-20 text-center">
                  <span className="text-5xl mb-4 block">📦</span>
                  <p className="text-slate-500 font-bold">No matches found in academy records.</p>
              </div>
          ) : (
              data.matches.map(m => (
                  <div 
                    key={m.id} 
                    onClick={() => onSelectMatch(m)}
                    className="bg-slate-800 p-5 rounded-3xl border border-slate-700 active:scale-95 transition-transform"
                  >
                      <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-black text-amber-500 uppercase tracking-widest">{m.venue || 'Friendly'}</span>
                          <span className="text-xs text-slate-500">{m.date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                          <div className="text-center flex-1">
                              <p className="font-black text-white text-lg">{m.teams[0].name}</p>
                              <p className="text-2xl font-black text-amber-400">{m.innings[0].totalRuns}/{m.innings[0].totalWickets}</p>
                          </div>
                          <div className="px-4 text-slate-600 font-black italic">VS</div>
                          <div className="text-center flex-1">
                              <p className="font-black text-white text-lg">{m.teams[1].name}</p>
                              <p className="text-2xl font-black text-amber-400">{m.innings[1]?.totalRuns || 0}/{m.innings[1]?.totalWickets || 0}</p>
                          </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                         <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${m.status === 'completed' ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'}`}>
                             {m.status}
                         </span>
                         <span className="text-xs text-slate-400 font-bold">Tap to view details</span>
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default MatchHistory;
