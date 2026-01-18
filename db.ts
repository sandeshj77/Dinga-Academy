
import { AppData, UserProfile, Match, Team, Player } from './types';

const STORAGE_KEY = 'dinda_academy_data';

const DEFAULT_DATA: AppData = {
  user: {
    academyName: '',
    isRegistered: false,
  },
  matches: [],
  teams: [],
  players: [],
};

export const db = {
  getData: (): AppData => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_DATA;
  },

  saveData: (data: AppData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  updateUser: (user: UserProfile) => {
    const data = db.getData();
    data.user = user;
    db.saveData(data);
  },

  addMatch: (match: Match) => {
    const data = db.getData();
    data.matches.unshift(match);
    db.saveData(data);
  },

  updateMatch: (updatedMatch: Match) => {
    const data = db.getData();
    data.matches = data.matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    db.saveData(data);
  },

  addTeam: (team: Team) => {
    const data = db.getData();
    data.teams.push(team);
    db.saveData(data);
  },

  getPlayers: (): Player[] => {
    const data = db.getData();
    // In this app, we derive global player stats from all match history
    // but we can also store a master player list
    return data.players;
  },
  
  savePlayers: (players: Player[]) => {
    const data = db.getData();
    data.players = players;
    db.saveData(data);
  }
};
