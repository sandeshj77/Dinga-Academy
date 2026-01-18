
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Match, BallEvent, ExtraType, WicketType, Innings, Player, Team } from '../types';
import * as htmlToImage from 'html-to-image';
import { Download, Share2, Undo2, Award, ChevronRight, User } from 'lucide-react';

interface Props {
  match: Match;
  onUpdateMatch: (m: Match) => void;
  onFinish: () => void;
}

const Scorer: React.FC<Props> = ({ match, onUpdateMatch, onFinish }) => {
  const currentInningsIndex = match.innings.length - 1;
  const currentInnings = match.innings[currentInningsIndex];
  
  const [showWicketDialog, setShowWicketDialog] = useState(false);
  const [showPlayerSelection, setShowPlayerSelection] = useState<'striker' | 'nonStriker' | 'bowler' | null>(null);
  const [isNoBallPending, setIsNoBallPending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const recentBallsRef = useRef<HTMLDivElement>(null);
  const scorecardCaptureRef = useRef<HTMLDivElement>(null);

  const battingTeam = match.teams.find(t => t.id === currentInnings.battingTeamId)!;
  const bowlingTeam = match.teams.find(t => t.id === currentInnings.bowlingTeamId)!;

  const striker = battingTeam.players.find(p => p.id === currentInnings.currentStrikerId);
  const nonStriker = battingTeam.players.find(p => p.id === currentInnings.currentNonStrikerId);
  const bowler = bowlingTeam.players.find(p => p.id === currentInnings.currentBowlerId);

  // Fix: Defined availableBatters and availableBowlers which were missing in the scope
  const availableBatters = battingTeam.players.filter(p => 
    p.id !== currentInnings.currentStrikerId && 
    p.id !== currentInnings.currentNonStrikerId &&
    !currentInnings.dismissedPlayerIds.includes(p.id)
  );

  const availableBowlers = bowlingTeam.players;

  useEffect(() => {
    if (recentBallsRef.current) {
      recentBallsRef.current.scrollTo({
        left: recentBallsRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [currentInnings.balls.length]);

  const getPlayerInningsStats = (playerId: string, innings: Innings) => {
    const ballsAsBatter = innings.balls.filter(b => b.strikerId === playerId);
    const runs = ballsAsBatter.reduce((sum, b) => sum + b.runs, 0);
    const ballsFaced = ballsAsBatter.filter(b => b.isLegal || b.extraType === ExtraType.NO_BALL).length;
    const fours = ballsAsBatter.filter(b => b.runs === 4).length;
    const sixes = ballsAsBatter.filter(b => b.runs === 6).length;
    const sr = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(1) : '0.0';

    const ballsAsBowler = innings.balls.filter(b => b.bowlerId === playerId);
    const runsConceded = ballsAsBowler.reduce((sum, b) => sum + b.runs + b.extraRuns, 0);
    const wickets = ballsAsBowler.filter(b => b.wicket && b.wicket.type !== WicketType.RETIRED).length;
    const legalBallsBowled = ballsAsBowler.filter(b => b.isLegal).length;
    const overs = `${Math.floor(legalBallsBowled / 6)}.${legalBallsBowled % 6}`;
    const economy = legalBallsBowled > 0 ? ((runsConceded / (legalBallsBowled / 6 || 1))).toFixed(2) : '0.00';

    return { runs, ballsFaced, fours, sixes, sr, runsConceded, wickets, overs, economy, legalBallsBowled };
  };

  const stats = useMemo(() => {
    const legalBalls = currentInnings.balls.filter(b => b.isLegal).length;
    const overs = Math.floor(legalBalls / match.settings.ballsPerOver);
    const ballsInOver = legalBalls % match.settings.ballsPerOver;
    const target = currentInningsIndex === 1 ? match.innings[0].totalRuns + 1 : null;

    return {
      totalRuns: currentInnings.totalRuns,
      totalWickets: currentInnings.totalWickets,
      oversDisplay: `${overs}.${ballsInOver}`,
      crr: (currentInnings.totalRuns / (legalBalls / match.settings.ballsPerOver || 1)).toFixed(2),
      target,
      recent: currentInnings.balls.slice(-12).map(b => {
          if (b.wicket) return 'W';
          if (b.extraType === ExtraType.WIDE) return `WD${b.extraRuns + b.runs}`;
          if (b.extraType === ExtraType.NO_BALL) return `NB${b.extraRuns + b.runs}`;
          if (b.extraType !== ExtraType.NONE) return b.extraType[0] + (b.runs + b.extraRuns);
          return b.runs.toString();
      })
    };
  }, [currentInnings, match.settings.ballsPerOver, currentInningsIndex, match.innings]);

  const activeStrikerStats = striker ? getPlayerInningsStats(striker.id, currentInnings) : null;
  const activeBowlerStats = bowler ? getPlayerInningsStats(bowler.id, currentInnings) : null;

  const selectPlayer = (playerId: string) => {
    if (showPlayerSelection === 'bowler' && playerId === currentInnings.lastBowlerId) {
      alert("Same bowler cannot bowl back-to-back overs!");
      return;
    }
    const updatedMatch: Match = { ...match, innings: [...match.innings] as any };
    const inn = { ...updatedMatch.innings[currentInningsIndex] };
    if (showPlayerSelection === 'striker') inn.currentStrikerId = playerId;
    else if (showPlayerSelection === 'nonStriker') inn.currentNonStrikerId = playerId;
    else if (showPlayerSelection === 'bowler') inn.currentBowlerId = playerId;
    updatedMatch.innings[currentInningsIndex] = inn;
    onUpdateMatch(updatedMatch);
    setShowPlayerSelection(null);
  };

  const undoLastBall = () => {
    if (currentInnings.balls.length === 0) return;
    const updatedMatch = { ...match, innings: [...match.innings] as any };
    const inn = { ...updatedMatch.innings[currentInningsIndex] };
    const lastBall = inn.balls[inn.balls.length - 1];
    
    inn.totalRuns -= (lastBall.runs + lastBall.extraRuns);
    if (lastBall.isLegal) inn.totalBalls -= 1;
    if (lastBall.wicket) {
        inn.totalWickets -= 1;
        inn.dismissedPlayerIds = inn.dismissedPlayerIds.filter(id => id !== lastBall.wicket?.playerOutId);
        inn.currentStrikerId = lastBall.strikerId;
    }
    
    // Reverse strike if runs were odd
    if (lastBall.runs % 2 !== 0) {
        const temp = inn.currentStrikerId;
        inn.currentStrikerId = inn.currentNonStrikerId;
        inn.currentNonStrikerId = temp;
    }

    // Reverse over-end swap if it was a legal over-ending ball
    const ballsRemainingInOver = (inn.totalBalls + 1) % match.settings.ballsPerOver;
    if (ballsRemainingInOver === 0 && lastBall.isLegal) {
        const temp = inn.currentStrikerId;
        inn.currentStrikerId = inn.currentNonStrikerId;
        inn.currentNonStrikerId = temp;
        inn.currentBowlerId = lastBall.bowlerId; // Restore bowler
    }

    inn.balls.pop();
    updatedMatch.innings[currentInningsIndex] = inn;
    onUpdateMatch(updatedMatch);
  };

  const addBall = (runs: number, extraType: ExtraType = ExtraType.NONE, wicketType?: WicketType) => {
    if (!striker || !nonStriker || !bowler) {
        alert("Set active players first!");
        return;
    }
    const effectiveExtraType = isNoBallPending ? ExtraType.NO_BALL : extraType;
    const isLegal = effectiveExtraType !== ExtraType.WIDE && effectiveExtraType !== ExtraType.NO_BALL;
    const extraRuns = (effectiveExtraType === ExtraType.WIDE || effectiveExtraType === ExtraType.NO_BALL) ? 1 : 0;
    
    const newBall: BallEvent = {
        id: Date.now().toString(),
        over: Math.floor(currentInnings.totalBalls / match.settings.ballsPerOver),
        ballNumber: (currentInnings.totalBalls % match.settings.ballsPerOver) + 1,
        strikerId: striker.id,
        nonStrikerId: nonStriker.id,
        bowlerId: bowler.id,
        runs,
        extraType: effectiveExtraType,
        extraRuns,
        wicket: wicketType ? { type: wicketType, playerOutId: striker.id } : undefined,
        isLegal
    };

    const updatedMatch: Match = { ...match, innings: [...match.innings] as any };
    const innings = { ...updatedMatch.innings[currentInningsIndex] };
    innings.balls = [...innings.balls, newBall];
    innings.totalRuns += (runs + extraRuns);
    if (wicketType) {
        innings.totalWickets += 1;
        innings.dismissedPlayerIds = [...innings.dismissedPlayerIds, striker.id];
        innings.currentStrikerId = undefined; 
    }
    if (isLegal) innings.totalBalls += 1;
    if (runs % 2 !== 0) {
        const temp = innings.currentStrikerId;
        innings.currentStrikerId = innings.currentNonStrikerId;
        innings.currentNonStrikerId = temp;
    }
    const overCompleted = (innings.balls.filter(b => b.isLegal).length % match.settings.ballsPerOver === 0) && isLegal && innings.totalBalls > 0;
    if (overCompleted) {
        innings.lastBowlerId = innings.currentBowlerId;
        innings.currentBowlerId = undefined;
        const temp = innings.currentStrikerId;
        innings.currentStrikerId = innings.currentNonStrikerId;
        innings.currentNonStrikerId = temp;
    }

    const target = currentInningsIndex === 1 ? match.innings[0].totalRuns + 1 : null;
    const isTargetReached = target !== null && innings.totalRuns >= target;
    const isAllOut = innings.totalWickets >= match.settings.maxWickets;
    const isOversFinished = innings.totalBalls >= match.settings.totalOvers * match.settings.ballsPerOver;

    if (isTargetReached || isAllOut || isOversFinished) {
        innings.status = 'completed';
        if (currentInningsIndex === 0) {
            updatedMatch.innings.push({
                battingTeamId: match.teams[1].id,
                bowlingTeamId: match.teams[0].id,
                totalRuns: 0,
                totalWickets: 0,
                totalBalls: 0,
                balls: [],
                status: 'active',
                dismissedPlayerIds: []
            });
        } else {
            updatedMatch.status = 'completed';
            const s1 = updatedMatch.innings[0].totalRuns;
            const s2 = innings.totalRuns;
            updatedMatch.winnerTeamId = s2 >= s1 + 1 ? match.teams[1].id : match.teams[0].id;
        }
    }

    updatedMatch.innings[currentInningsIndex] = innings;
    onUpdateMatch(updatedMatch);
    setIsNoBallPending(false);
  };

  const downloadScorecard = async () => {
    if (!scorecardCaptureRef.current) return;
    setIsDownloading(true);
    const captureEl = scorecardCaptureRef.current;
    
    try {
        // Robust capture options
        const options = {
            backgroundColor: '#0f172a',
            pixelRatio: 2,
            quality: 1,
            height: captureEl.scrollHeight,
            style: {
              height: 'auto',
              maxHeight: 'none',
              overflow: 'visible',
              fontFamily: 'system-ui, -apple-system, sans-serif' // Fallback for screenshot to avoid CSS access errors
            }
        };

        const dataUrl = await htmlToImage.toPng(captureEl, options);
        
        const link = document.createElement('a');
        link.download = `dinda-scorecard-${match.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Scorecard capture failed:', err);
        alert('Image generation failed due to cross-origin styles. Please take a manual screenshot for now.');
    } finally {
        setIsDownloading(false);
    }
  };

  const generateAwardData = () => {
    const playerAggregates: Record<string, { name: string, runs: number, wickets: number, runsConceded: number, ballsFaced: number, legalBallsBowled: number }> = {};
    match.innings.forEach(inn => {
      match.teams.forEach(t => t.players.forEach(p => {
        const pStats = getPlayerInningsStats(p.id, inn);
        if (!playerAggregates[p.id]) playerAggregates[p.id] = { name: p.name, runs: 0, wickets: 0, runsConceded: 0, ballsFaced: 0, legalBallsBowled: 0 };
        playerAggregates[p.id].runs += pStats.runs;
        playerAggregates[p.id].ballsFaced += pStats.ballsFaced;
        playerAggregates[p.id].wickets += pStats.wickets;
        playerAggregates[p.id].runsConceded += pStats.runsConceded;
        playerAggregates[p.id].legalBallsBowled += pStats.legalBallsBowled;
      }));
    });
    const players = Object.values(playerAggregates);
    const mvp = [...players].sort((a, b) => (b.runs + b.wickets * 25) - (a.runs + a.wickets * 25))[0];
    const expensive = [...players].sort((a, b) => b.runsConceded - a.runsConceded)[0];
    const duck = [...players].filter(p => p.runs === 0 && p.ballsFaced > 0).sort((a, b) => b.ballsFaced - a.ballsFaced)[0];
    return { mvp, expensive, duck };
  };

  const awards = match.status === 'completed' ? generateAwardData() : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800 p-6 pt-12 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-amber-500 font-black text-xl uppercase tracking-tighter italic">{battingTeam.name}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white leading-none">{stats.totalRuns}-{stats.totalWickets}</span>
              <span className="text-xl text-slate-500 font-black">({stats.oversDisplay})</span>
            </div>
          </div>
          <div className="text-right">
             <div className="bg-slate-800/50 px-3 py-1 rounded-full mb-1">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">CRR: {stats.crr}</p>
             </div>
             {stats.target && (
                <div className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Target: {stats.target}</p>
                </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
            <button onClick={() => setShowPlayerSelection('striker')} className={`p-4 rounded-[28px] border-2 transition-all text-left ${striker ? 'border-amber-500/40 bg-slate-800/40 shadow-xl' : 'border-dashed border-slate-700 bg-slate-950'}`}>
                <div className="flex justify-between items-start mb-1">
                   <p className="text-[9px] font-black text-slate-500 uppercase">Striker</p>
                   {activeStrikerStats && <span className="text-[10px] text-amber-500 font-black">{activeStrikerStats.sr} SR</span>}
                </div>
                <p className="font-black text-white truncate text-base">{striker?.name || 'ASSIGN BATTER'}</p>
                {activeStrikerStats && <p className="text-[10px] text-slate-400 font-bold mt-1">{activeStrikerStats.runs} ({activeStrikerStats.ballsFaced})</p>}
            </button>
            <button onClick={() => setShowPlayerSelection('nonStriker')} className={`p-4 rounded-[28px] border-2 transition-all text-left ${nonStriker ? 'border-slate-800 bg-slate-800/20' : 'border-dashed border-slate-700 bg-slate-950'}`}>
                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Non-Striker</p>
                <p className="font-black text-slate-400 truncate text-base">{nonStriker?.name || 'ASSIGN BATTER'}</p>
            </button>
            <button onClick={() => setShowPlayerSelection('bowler')} className={`col-span-2 p-4 rounded-[28px] border-2 transition-all text-left ${bowler ? 'border-indigo-500/40 bg-slate-800/40 shadow-xl' : 'border-dashed border-indigo-900 bg-slate-950'}`}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[9px] font-black text-indigo-400 uppercase">Current Bowler</p>
                  {activeBowlerStats && <span className="text-[10px] text-indigo-400 font-black">{activeBowlerStats.economy} EC</span>}
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="font-black text-white truncate text-lg">{bowler?.name || 'ASSIGN BOWLER'}</p>
                  {activeBowlerStats && <p className="text-sm font-black text-white">{activeBowlerStats.overs}-{activeBowlerStats.wickets}-{activeBowlerStats.runsConceded}</p>}
                </div>
            </button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar">
        <div className="mb-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Live Feed</h3>
             <button onClick={undoLastBall} className="flex items-center gap-1.5 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-400/10 px-4 py-1.5 rounded-full active:scale-95 transition-all">
                <Undo2 className="w-3 h-3" /> Undo
             </button>
           </div>
           <div ref={recentBallsRef} className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
             {stats.recent.map((b, i) => (
                <div key={i} className={`min-w-[48px] h-12 rounded-[18px] flex items-center justify-center font-black text-xs border ${b.includes('W') ? 'bg-red-600 border-red-400 text-white shadow-lg' : b.includes('NB') || b.includes('WD') ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                  {b}
                </div>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-4 gap-3.5 mb-2">
             {[0, 1, 2, 3, 4, 6].map(r => <button key={r} onClick={() => addBall(r)} className={`h-16 rounded-[22px] font-black text-xl active:scale-95 transition-all shadow-xl ${r === 4 || r === 6 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-white border border-slate-700'}`}>{r}</button>)}
             <button onClick={() => addBall(0, ExtraType.WIDE)} className="h-16 rounded-[22px] bg-indigo-600 text-white font-black text-[11px] uppercase shadow-lg">Wide</button>
             <button onClick={() => setIsNoBallPending(true)} className={`h-16 rounded-[22px] ${isNoBallPending ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'} text-white font-black text-[11px] uppercase shadow-lg`}>No Ball</button>
             <button onClick={() => setShowWicketDialog(true)} className="col-span-4 h-16 rounded-2xl bg-red-600 text-white font-black text-sm uppercase shadow-2xl active:scale-[0.98] transition-all tracking-widest">WICKET ☝️</button>
        </div>
      </div>

      {match.status === 'completed' && (
        <div className="fixed inset-0 bg-slate-950 z-[300] flex flex-col overflow-y-auto no-scrollbar">
            <div ref={scorecardCaptureRef} className="bg-slate-950 w-full flex flex-col flex-shrink-0" style={{ minHeight: 'fit-content' }}>
                <div className="bg-amber-500 p-10 pt-20 text-slate-950 text-center relative overflow-hidden">
                    <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none mb-2">Match Report</h1>
                    <p className="font-black uppercase text-sm opacity-90">{match.teams.find(t => t.id === match.winnerTeamId)?.name} Won!</p>
                </div>
                <div className="p-8 space-y-12">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="bg-slate-900 border-l-4 border-amber-500 rounded-3xl p-6 flex items-center gap-5">
                            <span className="text-4xl">🏅</span>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase">MVP</p>
                                <p className="text-xl font-black text-white italic uppercase">{awards?.mvp?.name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                    {match.innings.map((inn, idx) => {
                        const t = match.teams.find(tm => tm.id === inn.battingTeamId)!;
                        const bT = match.teams.find(tm => tm.id === inn.bowlingTeamId)!;
                        return (
                            <div key={idx} className="space-y-6">
                                <h3 className="text-white font-black text-2xl uppercase italic border-b-2 border-slate-900 pb-2 flex justify-between">
                                  <span>{t.name}</span>
                                  <span className="text-amber-500">{inn.totalRuns}-{inn.totalWickets}</span>
                                </h3>
                                <div className="bg-slate-900 border border-slate-800 rounded-[32px] overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-800/50 text-[10px] font-black text-slate-500 uppercase">
                                            <tr><th className="px-6 py-4">Batter</th><th className="px-3 py-4 text-center">R</th><th className="px-3 py-4 text-center">B</th><th className="px-3 py-4 text-center">SR</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {t.players.map(p => {
                                                const s = getPlayerInningsStats(p.id, inn);
                                                if (s.ballsFaced === 0 && !inn.dismissedPlayerIds.includes(p.id)) return null;
                                                return (
                                                    <tr key={p.id}>
                                                        <td className="px-6 py-4 text-white text-xs font-black uppercase">{p.name} {inn.dismissedPlayerIds.includes(p.id) ? '☝️' : '*'}</td>
                                                        <td className="px-3 py-4 text-center text-amber-500 font-black text-xs">{s.runs}</td>
                                                        <td className="px-3 py-4 text-center text-slate-400 text-[10px]">{s.ballsFaced}</td>
                                                        <td className="px-3 py-4 text-center text-slate-500 text-[10px]">{s.sr}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="px-8 pb-10 pt-6 space-y-4 mt-auto bg-slate-950/90 backdrop-blur-xl border-t border-slate-900 sticky bottom-0 z-50">
                <button disabled={isDownloading} onClick={downloadScorecard} className="w-full py-5 bg-emerald-500 text-slate-950 rounded-[32px] font-black text-lg flex items-center justify-center gap-3 active:scale-95 shadow-2xl">
                    {isDownloading ? <span className="animate-spin text-xl">⏳</span> : <><Download className="w-5 h-5" /> Save Scorecard</>}
                </button>
                <button onClick={onFinish} className="w-full py-4 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-2">Close Arena</button>
            </div>
        </div>
      )}

      {showPlayerSelection && (
          <div className="fixed inset-0 bg-slate-950/98 z-[100] p-8 flex flex-col">
              <h2 className="text-3xl font-black text-white mb-8 uppercase italic">Assign {showPlayerSelection}</h2>
              <div className="grid grid-cols-2 gap-4 overflow-y-auto no-scrollbar pb-10">
                  {(showPlayerSelection === 'bowler' ? availableBowlers : availableBatters).map(p => (
                      <button key={p.id} onClick={() => selectPlayer(p.id)} className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] flex flex-col items-center gap-3 active:bg-amber-500 group">
                          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                             {p.photo ? <img src={p.photo} className="w-full h-full object-cover rounded-2xl" /> : <User className="w-7 h-7" />}
                          </div>
                          <span className="font-black text-xs text-center text-slate-200 uppercase truncate w-full">{p.name}</span>
                      </button>
                  ))}
              </div>
              <button onClick={() => setShowPlayerSelection(null)} className="mt-auto py-6 text-slate-600 font-black uppercase tracking-[0.3em] text-[10px]">Back</button>
          </div>
      )}

      {showWicketDialog && (
        <div className="fixed inset-0 bg-slate-950/95 z-[110] flex items-center justify-center p-8">
          <div className="bg-slate-900 w-full max-w-sm rounded-[48px] p-10 border border-slate-800 shadow-2xl">
            <h2 className="text-2xl font-black text-white mb-8 text-center uppercase italic">Out! ☝️</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(WicketType).map(type => (
                <button key={type} onClick={() => { addBall(0, ExtraType.NONE, type); setShowWicketDialog(false); }} className="py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-black text-[10px] uppercase shadow-lg hover:bg-red-600">{type}</button>
              ))}
            </div>
            <button onClick={() => setShowWicketDialog(false)} className="w-full mt-8 py-4 text-slate-500 font-black uppercase text-[10px]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scorer;
