export enum GameView {
  MENU = 'MENU',
  GARAGE = 'GARAGE',
  LEADERBOARD = 'LEADERBOARD',
  HELP = 'HELP',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY'
}

export enum TrackType {
  CITY = 'CITY',      // Classic city asphalt with green sides
  DESERT = 'DESERT',  // Orange highway with sand dunes
  NEON_NIGHT = 'NEON_NIGHT' // Dark synthwave neon purple road
}

export interface Vehicle {
  id: string;
  name: string;
  desc: string;
  speed: number;       // 1-10 stats
  handling: number;    // 1-10 stats
  fuelEfficiency: number; // 1-10 stats
  color: string;       // Primary visual hex/color
  accentColor: string; // Trim color for racing stripes
  spriteUrl?: string;  // We'll draw procedurally, but hold color
  price: number;       // Game coins needed to unlock (or unlocked by default)
}

export interface ScoreRecord {
  id: string;
  playerName: string;
  score: number;
  distance: number;
  coins: number;
  carName: string;
  trackType: TrackType;
  date: string;
}

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  fuel: number;         // 0 to 100
  speed: number;        // current velocity in km/h
  isTurbo: boolean;     // Invincible & fast
  turboTimeRemaining: number; // in ms
  isSpun: boolean;      // Hit oil spill, spinning
  spinTimeRemaining: number;  // in ms
  lap: number;            // Current lap, e.g. 1, 2, 3
  bulletsCount: number;   // Bullet supply count
  position: number;       // Current race standing e.g. 1st, 2nd, 3rd, 4th, 5th
  isFinished: boolean;    // Got to finish line
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Bullet {
  id: string;
  x: number;          // normalized coordinate or exact pixel coordinate
  y: number;          // vertical pixel coordinates
  speed: number;
}

export interface Opponent {
  id: string;
  name: string;
  x: number;          // relative horizontal position (-1.2 to 1.2)
  targetX: number;
  y: number;          // relative Y to the viewport (or relative distance track progression)
  color: string;
  accentColor: string;
  speed: number;
  distanceProgress: number; // overall calculated distance
  isDead: boolean;
  deadTimer: number;
}

export interface Obstacle {
  id: string;
  x: number;          // normalized X: 0 to 1 (left side of road to right side)
  y: number;          // relative Y (pixels from starting line/screen top)
  type: 'CAR_RED' | 'CAR_YELLOW' | 'CAR_BLUE' | 'OIL_SPILL' | 'ROAD_BARRIER' | 'COIN' | 'GAS_CANISTER' | 'STAR_TURBO' | 'BULLET_REFILL';
  speed: number;      // velocity if moving car
  width: number;      // lane collision width
  height: number;     // collision height
  collected?: boolean;
  scoreAwarded?: boolean;
}

