
import React, { useMemo, useState } from 'react';
import { db } from '../db';
import { Player } from '../types';
import { Trophy, ChevronDown, Zap, Target, ShieldCheck } from 'lucide-react';

interface Props {
  onBack: () => void;
}

type RankingCategory = 'batsman' | 'bowler' | 'allrounder';

const Rankings: React.FC<Props> = ({ onBack }) => {
  const [category, setCategory] = useState<RankingCategory>('allrounder');
  const [showDropdown, setShowDropdown] = useState(false);
  const data = db.getData();

  const rankedPlayers = useMemo(() => {
    const statsMap: Record<string, Player & { legalBallsBowled: number }> = {};

    data.matches.forEach(m => {
        m.teams.forEach(t => {
            t.players.forEach(p => {
                if (!statsMap[p.id]) {
                    statsMap[p.id] = { 
                      ...p, 
                      runs: 0, 
                      wickets: 0, 
                      ballsFaced: 0, 
                      ballsBowled: 0, 
                      legalBallsBowled: 0,
                      runsConceded: 0, 
                      matches: 0,
                      rank: 0 
                    };
                }
                statsMap[p.id].matches += 1;
            });
        });

        m.innings.forEach(inn => {
            inn.balls.forEach(ball => {
                const batter = statsMap[ball.strikerId];
                if (batter) {
                    batter.runs += ball.runs;
                    if (ball.isLegal || ball.extraType === 'No Ball') batter.ballsFaced += 1;
                }
                const bowler = statsMap[ball.bowlerId];
                if (bowler) {
                    bowler.runsConceded += ball.runs + ball.extraRuns;
                    if (ball.isLegal) {
                        bowler.ballsBowled += 1;
                        bowler.legalBallsBowled += 1;
                    }
                    if (ball.wicket && ball.wicket.type !== 'Retired') bowler.wickets += 1;
                }
            });
        });
    });

    const playerList = Object.values(statsMap);

    return playerList
      .sort((a, b) => {
        if (category === 'batsman') {
            if (b.runs !== a.runs) return b.runs - a.runs;
            const srA = (a.runs / (a.ballsFaced || 1)) * 100;
            const srB = (b.runs / (b.ballsFaced || 1)) * 100;
            return srB - srA;
        } else if (category === 'bowler') {
            if (b.wickets !== a.wickets) return b.wickets - a.wickets;
            const econA = (a.runsConceded / (a.legalBallsBowled / 6 || 1));
            const econB = (b.runsConceded / (b.legalBallsBowled / 6 || 1));
            return econA - econB; 
        } else {
            const scoreA = a.runs + (a.wickets * 25);
            const scoreB = b.runs + (b.wickets * 25);
            return scoreB - scoreA;
        }
      })
      .map((p, index) => ({
        ...p,
        rank: index + 1
      }));
  }, [data.matches, category]);

  const categories = [
    { id: 'allrounder', label: 'All-Rounders', icon: <Zap className="w-4 h-4" /> },
    { id: 'batsman', label: 'Top Batsmen', icon: <Target className="w-4 h-4" /> },
    { id: 'bowler', label: 'Top Bowlers', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar bg-slate-950">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-slate-400 hover:text-white mr-4 transition-colors">
                <span className="text-2xl">←</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Rankings</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{data.user.academyName}</p>
            </div>
        </div>
        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Trophy className="text-slate-950 w-6 h-6" />
        </div>
      </div>

      <div className="relative mb-6">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-xl active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-500">
              {categories.find(c => c.id === category)?.icon}
            </span>
            <span className="font-black text-white uppercase tracking-tighter">
              {categories.find(c => c.id === category)?.label}
            </span>
          </div>
          <ChevronDown className={`text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id as RankingCategory);
                  setShowDropdown(false);
                }}
                className={`w-full p-4 flex items-center gap-3 transition-colors text-left ${
                  category === cat.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {cat.icon}
                <span className="font-black uppercase tracking-tighter text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
          {rankedPlayers.length > 0 ? (
              rankedPlayers.map((p) => (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg animate-fade-in">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic ${
                        p.rank === 1 ? 'bg-amber-500 text-slate-950' : 
                        p.rank === 2 ? 'bg-slate-300 text-slate-900' : 
                        p.rank === 3 ? 'bg-orange-400 text-slate-900' : 
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {p.rank}
                      </div>
                      
                      <div className="flex-1">
                          <h2 className="font-black text-white uppercase tracking-tighter truncate">{p.name}</h2>
                          <div className="flex gap-4 mt-2">
                              {category !== 'bowler' && (
                                  <div>
                                      <p className="text-[8px] text-slate-500 font-bold uppercase">Runs</p>
                                      <p className="font-black text-emerald-400 text-xs">{p.runs}</p>
                                  </div>
                              )}
                              {category !== 'batsman' && (
                                  <div>
                                      <p className="text-[8px] text-slate-500 font-bold uppercase">Wickets</p>
                                      <p className="font-black text-amber-500 text-xs">{p.wickets}</p>
                                  </div>
                              )}
                              <div>
                                  <p className="text-[8px] text-slate-500 font-bold uppercase">
                                    {category === 'bowler' ? 'Economy' : 'Strike Rate'}
                                  </p>
                                  <p className="font-black text-slate-400 text-xs">
                                      {category === 'bowler' 
                                        ? (p.runsConceded / (p.legalBallsBowled / 6 || 1)).toFixed(2)
                                        : ((p.runs / (p.ballsFaced || 1)) * 100).toFixed(0)}
                                  </p>
                              </div>
                          </div>
                      </div>

                      {p.photo && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800">
                          <img src={p.photo} className="w-full h-full object-cover opacity-60" />
                        </div>
                      )}
                  </div>
              ))
          ) : (
              <div className="py-20 text-center bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-800">
                  <p className="text-slate-600 font-black uppercase tracking-widest text-xs italic">Awaiting match logs...</p>
              </div>
          )}

          <div className="mt-8 bg-amber-500 p-6 rounded-[32px] shadow-2xl">
              <h3 className="font-black text-slate-950 uppercase tracking-tighter italic mb-1">Academy Logic</h3>
              <p className="text-[10px] font-bold text-slate-900/70 leading-relaxed uppercase tracking-tight">
                  {category === 'batsman' ? 'Ranked by runs then strike-rate.' : 
                   category === 'bowler' ? 'Ranked by wickets then economy rate.' : 
                   'The Dinda Index: Combined runs and wickets (25 pts/wicket).'}
              </p>
          </div>
      </div>
    </div>
  );
};

export default Rankings;
