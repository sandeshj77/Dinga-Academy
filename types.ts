
export type UserProfile = {
  academyName: string;
  managerName?: string;
  logo?: string;
  pin?: string;
  isRegistered: boolean;
};

export type Player = {
  id: string;
  name: string;
  photo?: string; // base64 or local blob url
  matches: number;
  runs: number;
  wickets: number;
  ballsFaced: number;
  ballsBowled: number;
  runsConceded: number;
  bestBowling?: string;
  highestScore: number;
  fours: number;
  sixes: number;
  rank?: number; // Added to store performance rank
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
};

export enum WicketType {
  BOWLED = 'Bowled',
  CAUGHT = 'Caught',
  LBW = 'LBW',
  RUN_OUT = 'Run Out',
  STUMPED = 'Stumped',
  HIT_WICKET = 'Hit Wicket',
  RETIRED = 'Retired'
}

export enum ExtraType {
  NONE = 'None',
  WIDE = 'Wide',
  NO_BALL = 'No Ball',
  BYE = 'Bye',
  LEG_BYE = 'Leg Bye'
}

export type BallEvent = {
  id: string;
  over: number;
  ballNumber: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extraType: ExtraType;
  extraRuns: number;
  wicket?: {
    type: WicketType;
    playerOutId: string;
  };
  isLegal: boolean;
};

export type MatchSettings = {
  totalOvers: number;
  ballsPerOver: number;
  maxWickets: number;
  teamSize: number;
};

export type Innings = {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  totalBalls: number;
  balls: BallEvent[];
  status: 'active' | 'completed';
  dismissedPlayerIds: string[];
  currentStrikerId?: string;
  currentNonStrikerId?: string;
  currentBowlerId?: string;
  lastBowlerId?: string;
};

export type Match = {
  id: string;
  name: string;
  tournamentName?: string;
  venue?: string;
  date: string;
  settings: MatchSettings;
  teams: [Team, Team];
  innings: [Innings] | [Innings, Innings];
  status: 'upcoming' | 'live' | 'completed';
  winnerTeamId?: string;
  tossWinnerId?: string;
  tossChoice?: 'bat' | 'bowl';
};

export type AppData = {
  user: UserProfile;
  matches: Match[];
  teams: Team[];
  players: Player[];
};
