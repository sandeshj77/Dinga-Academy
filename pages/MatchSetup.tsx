
import React, { useState } from 'react';
import { Match, Team, Player } from '../types';
import { db } from '../db';

interface Props {
  onCancel: () => void;
  onStart: (match: Match) => void;
}

const MatchSetup: React.FC<Props> = ({ onCancel, onStart }) => {
  const [step, setStep] = useState(1);
  const [matchName, setMatchName] = useState('Academy Clash');
  const [venue, setVenue] = useState('Dinda Memorial Ground');
  const [totalOvers, setTotalOvers] = useState(2);
  const [ballsPerOver, setBallsPerOver] = useState(6);
  
  // Scoring formula for ranking: Runs + (Wickets * 25)
  const calculateScore = (p: Player) => (p.runs || 0) + ((p.wickets || 0) * 25);

  const recalculateRanks = (players: Player[]): Player[] => {
    if (players.length === 0) return [];
    const sorted = [...players].sort((a, b) => calculateScore(b) - calculateScore(a));
    return players.map(p => {
      const rankIndex = sorted.findIndex(s => s.id === p.id);
      return { ...p, rank: rankIndex + 1 };
    });
  };

  // Initialize with empty teams as requested
  const [team1Name, setTeam1Name] = useState('Team A');
  const [team1Players, setTeam1Players] = useState<Player[]>([]);

  const [team2Name, setTeam2Name] = useState('Team B');
  const [team2Players, setTeam2Players] = useState<Player[]>([]);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhoto, setNewPlayerPhoto] = useState<string>('');
  
  // Editing State
  const [editingPlayer, setEditingPlayer] = useState<{player: Player, teamIndex: 1 | 2} | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit && editingPlayer) {
          setEditingPlayer({
            ...editingPlayer,
            player: { ...editingPlayer.player, photo: reader.result as string }
          });
        } else {
          setNewPlayerPhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addPlayerToTeam = (teamIndex: 1 | 2) => {
    if (!newPlayerName.trim()) return;
    
    const targetTeam = teamIndex === 1 ? team1Players : team2Players;
    if (targetTeam.some(p => p.name.toLowerCase() === newPlayerName.toLowerCase())) {
      alert("Player name must be unique in this team!");
      return;
    }

    const newPlayer: Player = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: newPlayerName,
      photo: newPlayerPhoto,
      matches: 0,
      runs: 0,
      wickets: 0,
      ballsFaced: 0,
      ballsBowled: 0,
      runsConceded: 0,
      highestScore: 0,
      fours: 0,
      sixes: 0
    };

    if (teamIndex === 1) {
      setTeam1Players(recalculateRanks([...team1Players, newPlayer]));
    } else {
      setTeam2Players(recalculateRanks([...team2Players, newPlayer]));
    }

    setNewPlayerName('');
    setNewPlayerPhoto('');
  };

  const saveEditedPlayer = () => {
    if (!editingPlayer || !editingPlayer.player.name.trim()) return;
    
    if (editingPlayer.teamIndex === 1) {
      setTeam1Players(recalculateRanks(team1Players.map(p => p.id === editingPlayer.player.id ? editingPlayer.player : p)));
    } else {
      setTeam2Players(recalculateRanks(team2Players.map(p => p.id === editingPlayer.player.id ? editingPlayer.player : p)));
    }
    setEditingPlayer(null);
  };

  const handleStart = () => {
    if (team1Players.length < 1 || team2Players.length < 1) {
        alert("Each team needs at least 1 player!");
        return;
    }

    const t1: Team = { id: 't1', name: team1Name, players: team1Players };
    const t2: Team = { id: 't2', name: team2Name, players: team2Players };

    const newMatch: Match = {
      id: Date.now().toString(),
      name: matchName || 'Friendly Match',
      venue,
      date: new Date().toLocaleDateString(),
      status: 'live',
      settings: {
        totalOvers,
        ballsPerOver,
        maxWickets: Math.max(team1Players.length, team2Players.length) - 1,
        teamSize: Math.max(team1Players.length, team2Players.length)
      },
      teams: [t1, t2],
      innings: [
        {
          battingTeamId: 't1',
          bowlingTeamId: 't2',
          totalRuns: 0,
          totalWickets: 0,
          totalBalls: 0,
          balls: [],
          status: 'active',
          dismissedPlayerIds: []
        }
      ]
    };

    db.addMatch(newMatch);
    onStart(newMatch);
  };

  const PlayerItem: React.FC<{ player: Player, onEdit: () => void, onDelete: () => void }> = ({ player, onEdit, onDelete }) => (
    <div className="bg-slate-900 px-3 py-2 rounded-xl flex items-center gap-2 border border-slate-700 shadow-sm group">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
          {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <span className="text-[10px]">👤</span>}
        </div>
        {player.rank && (
          <div className="absolute -top-1 -left-1 bg-amber-500 text-slate-950 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900">
            {player.rank}
          </div>
        )}
      </div>
      <span className="text-xs font-black text-slate-200 uppercase tracking-tighter truncate max-w-[70px]">{player.name}</span>
      <div className="flex gap-1 ml-auto">
        <button onClick={onEdit} className="text-amber-500 hover:text-amber-400 p-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button onClick={onDelete} className="text-red-500 hover:text-red-400 p-1 text-lg leading-none">×</button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto no-scrollbar bg-slate-900">
      <div className="flex items-center mb-8">
        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-white mr-4">
          <span className="text-2xl">←</span>
        </button>
        <h1 className="text-2xl font-black text-white">Setup {step}/3</h1>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
            <h2 className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Match Details</h2>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              placeholder="Match Name"
              value={matchName}
              onChange={e => setMatchName(e.target.value)}
            />
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white outline-none focus:ring-1 focus:ring-amber-500 font-bold"
              placeholder="Venue"
              value={venue}
              onChange={e => setVenue(e.target.value)}
            />
          </div>

          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4 shadow-xl">
            <h2 className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Innings Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Overs</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white mt-1 font-black" value={totalOvers} onChange={e => setTotalOvers(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Balls/Over</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white mt-1 font-black" value={ballsPerOver} onChange={e => setBallsPerOver(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <button onClick={() => setStep(2)} className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl uppercase tracking-tighter">Next: Settle Squads</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Team 1 Squad</h2>
                <span className="text-[10px] font-black text-slate-500 uppercase">{team1Players.length} Players</span>
            </div>
            <input type="text" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-black" placeholder="Team 1 Name" value={team1Name} onChange={e => setTeam1Name(e.target.value)} />
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" className="flex-1 bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-bold" placeholder="Add Player..." value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} />
                <button onClick={() => addPlayerToTeam(1)} className="bg-amber-500 w-14 h-14 flex items-center justify-center rounded-xl text-slate-950 font-black text-2xl shadow-lg">+</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center p-3 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e)} />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{newPlayerPhoto ? '✅ Photo Added' : '📷 Add Photo (Optional)'}</span>
                </label>
                {newPlayerPhoto && <button onClick={() => setNewPlayerPhoto('')} className="text-red-500 font-black text-xs">Clear</button>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 max-h-48 overflow-y-auto no-scrollbar">
              {team1Players.length > 0 ? team1Players.map(p => (
                <PlayerItem 
                  key={p.id} 
                  player={p} 
                  onEdit={() => setEditingPlayer({ player: { ...p }, teamIndex: 1 })}
                  onDelete={() => setTeam1Players(recalculateRanks(team1Players.filter(x => x.id !== p.id)))} 
                />
              )) : (
                <div className="col-span-2 py-4 text-center text-slate-600 text-[10px] font-black uppercase border border-dashed border-slate-700 rounded-xl">No players added yet</div>
              )}
            </div>
          </div>
          <button onClick={() => setStep(3)} className="w-full py-5 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl uppercase tracking-tighter">Configure Opponents</button>
          <button onClick={() => setStep(1)} className="w-full py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest">Back</button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
             <div className="flex justify-between items-center">
                <h2 className="text-amber-500 font-black text-[10px] uppercase tracking-widest">Team 2 Squad</h2>
                <span className="text-[10px] font-black text-slate-500 uppercase">{team2Players.length} Players</span>
            </div>
            <input type="text" className="w-full bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-black" placeholder="Team 2 Name" value={team2Name} onChange={e => setTeam2Name(e.target.value)} />
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input type="text" className="flex-1 bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-bold" placeholder="Add Player..." value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} />
                <button onClick={() => addPlayerToTeam(2)} className="bg-amber-500 w-14 h-14 flex items-center justify-center rounded-xl text-slate-950 font-black text-2xl shadow-lg">+</button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center p-3 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e)} />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{newPlayerPhoto ? '✅ Photo Added' : '📷 Add Photo (Optional)'}</span>
                </label>
                {newPlayerPhoto && <button onClick={() => setNewPlayerPhoto('')} className="text-red-500 font-black text-xs">Clear</button>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 max-h-48 overflow-y-auto no-scrollbar">
              {team2Players.length > 0 ? team2Players.map(p => (
                <PlayerItem 
                  key={p.id} 
                  player={p} 
                  onEdit={() => setEditingPlayer({ player: { ...p }, teamIndex: 2 })}
                  onDelete={() => setTeam2Players(recalculateRanks(team2Players.filter(x => x.id !== p.id)))} 
                />
              )) : (
                <div className="col-span-2 py-4 text-center text-slate-600 text-[10px] font-black uppercase border border-dashed border-slate-700 rounded-xl">No players added yet</div>
              )}
            </div>
          </div>
          <button onClick={handleStart} className="w-full py-6 bg-emerald-500 text-slate-950 font-black rounded-[40px] shadow-2xl uppercase tracking-tighter text-xl active:scale-95 transition-transform">Start Match 🏏</button>
          <button onClick={() => setStep(2)} className="w-full py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest">Back to Squads</button>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 w-full max-w-sm shadow-2xl space-y-6">
            <h2 className="text-xl font-black text-white text-center uppercase tracking-tight">Edit Player</h2>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-[32px] bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-inner flex items-center justify-center relative group">
                  {editingPlayer.player.photo ? <img src={editingPlayer.player.photo} className="w-full h-full object-cover" /> : <span className="text-3xl">👤</span>}
                  <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} />
                    <span className="text-[10px] font-black text-white uppercase">Change</span>
                  </label>
                </div>
                {editingPlayer.player.rank && (
                  <div className="absolute -top-2 -left-2 bg-amber-500 text-slate-950 text-xs font-black w-8 h-8 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
                    #{editingPlayer.player.rank}
                  </div>
                )}
              </div>
              <input 
                type="text" 
                className="w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl text-white font-black text-center outline-none focus:ring-1 focus:ring-amber-500"
                value={editingPlayer.player.name}
                onChange={e => setEditingPlayer({ ...editingPlayer, player: { ...editingPlayer.player, name: e.target.value } })}
              />
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Runs</p>
                  <p className="text-white font-black">{editingPlayer.player.runs}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase">Wickets</p>
                  <p className="text-white font-black">{editingPlayer.player.wickets}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setEditingPlayer(null)} className="py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={saveEditedPlayer} className="py-4 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-tighter shadow-lg shadow-amber-900/10">Save Info</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchSetup;
