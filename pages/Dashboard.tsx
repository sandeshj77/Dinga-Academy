
import React, { useMemo } from 'react';
import { db } from '../db';
import { View } from '../App';

interface Props {
  onStartMatch: () => void;
  onNavigate: (view: View) => void;
}

const Dashboard: React.FC<Props> = ({ onStartMatch, onNavigate }) => {
  const data = db.getData();
  
  const stats = useMemo(() => {
    const totalMatches = data.matches.length;
    let totalRuns = 0;
    let totalWickets = 0;
    let highestScore = 0;

    data.matches.forEach(m => {
        m.innings.forEach(inn => {
            totalRuns += inn.totalRuns;
            totalWickets += inn.totalWickets;
            if (inn.totalRuns > highestScore) highestScore = inn.totalRuns;
        });
    });

    return { totalMatches, totalRuns, totalWickets, highestScore };
  }, [data.matches]);

  const quickActions = [
    { label: 'Start Match', icon: '🏏', onClick: onStartMatch, color: 'bg-emerald-500' },
    { label: 'Match History', icon: '📜', onClick: () => onNavigate(View.HISTORY), color: 'bg-blue-500' },
    { label: 'Rankings', icon: '🏆', onClick: () => onNavigate(View.RANKINGS), color: 'bg-amber-500' },
    { label: 'Academy Settings', icon: '⚙️', onClick: () => onNavigate(View.SETTINGS), color: 'bg-slate-500' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-24">
      {/* Header */}
      <div className="p-6 bg-slate-950 flex justify-between items-center border-b border-slate-800 sticky top-0 z-10">
        <div>
          <p className="text-slate-400 text-sm">Good Day, Coach!</p>
          <h1 className="text-xl font-bold text-white">{data.user.academyName}</h1>
        </div>
        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-xl shadow-lg">
          🏏
        </div>
      </div>

      {/* Stats Summary */}
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Total Matches</p>
          <p className="text-3xl font-black text-white">{stats.totalMatches}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Runs Logged</p>
          <p className="text-3xl font-black text-emerald-400">{stats.totalRuns}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Total Wickets</p>
          <p className="text-3xl font-black text-red-400">{stats.totalWickets}</p>
        </div>
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Highest Innings</p>
          <p className="text-3xl font-black text-amber-400">{stats.highestScore}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6">
        <h2 className="text-lg font-bold mb-4 text-white">Academy Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`${action.color} p-5 rounded-3xl flex flex-col items-center justify-center text-slate-950 shadow-lg active:scale-95 transition-transform`}
            >
              <span className="text-3xl mb-2">{action.icon}</span>
              <span className="font-black text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Match Preview */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Last Match</h2>
          <button onClick={() => onNavigate(View.HISTORY)} className="text-amber-500 text-sm font-bold">View All</button>
        </div>
        {data.matches.length > 0 ? (
          <div className="bg-slate-800 rounded-3xl p-5 border border-slate-700 shadow-xl">
             <div className="flex justify-between items-center mb-3">
               <span className="text-xs text-slate-400">{data.matches[0].date}</span>
               <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${data.matches[0].status === 'completed' ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'}`}>
                 {data.matches[0].status}
               </span>
             </div>
             <div className="flex justify-between items-center text-lg font-bold">
               <span>{data.matches[0].teams[0].name}</span>
               <span className="text-slate-500 italic">vs</span>
               <span>{data.matches[0].teams[1].name}</span>
             </div>
             <div className="mt-4 flex justify-between items-end">
               <div>
                  <p className="text-xs text-slate-400">{data.matches[0].venue || 'Local Ground'}</p>
               </div>
               <button onClick={() => onNavigate(View.HISTORY)} className="bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold">
                 Details
               </button>
             </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl p-10 text-center text-slate-500">
            No matches recorded yet. Start your first game!
          </div>
        )}
      </div>

      {/* Dinda Award Hint */}
      <div className="px-6 py-4 mx-6 mt-4 bg-gradient-to-r from-amber-600 to-amber-400 rounded-2xl text-slate-950">
          <p className="text-sm font-black">🔥 Dinda Academy Award</p>
          <p className="text-xs font-bold opacity-80">Check Rankings to see who is currently the most expensive bowler in the academy!</p>
      </div>
    </div>
  );
};

export default Dashboard;
