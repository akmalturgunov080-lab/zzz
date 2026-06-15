/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { GameView, TrackType, Vehicle, GameStats, ScoreRecord } from './types';
import { VEHICLES } from './data/vehicles';
import { soundManager } from './components/SoundManager';
import { GameCanvas } from './components/GameCanvas';
import { LeaderboardList } from './components/LeaderboardList';
import { Garage } from './components/Garage';

import { 
  Car, 
  Trophy, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Home, 
  Coins, 
  Sparkles, 
  Gamepad2, 
  User, 
  ShieldAlert, 
  Compass,
  ArrowRight,
  Flame,
  Check
} from 'lucide-react';

export default function App() {
  // Views navigation
  const [currentView, setCurrentView] = useState<GameView>(GameView.MENU);
  
  // Game Configuration Parameters
  const [playerName, setPlayerName] = useState<string>('Poygachi');
  const [totalCoins, setTotalCoins] = useState<number>(0);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle>(VEHICLES[0]);
  const [selectedTrack, setSelectedTrack] = useState<TrackType>(TrackType.CITY);
  
  // Active Game State Feed from Canvas Loop
  const [hudStats, setHudStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    fuel: 100,
    speed: 0,
    isTurbo: false,
    turboTimeRemaining: 0,
    isSpun: false,
    spinTimeRemaining: 0,
    lap: 1,
    bulletsCount: 5,
    position: 5,
    isFinished: false
  });

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Final stats placeholder to show after crash on GameOver view
  const [finalScores, setFinalScores] = useState({
    score: 0,
    distance: 0,
    coins: 0
  });

  // Load initial settings and coins on mount
  useEffect(() => {
    const storedCoins = localStorage.getItem('tezlik_poygasi_coins');
    if (storedCoins) {
      setTotalCoins(parseInt(storedCoins) || 0);
    } else {
      localStorage.setItem('tezlik_poygasi_coins', '50'); // 50 free coins for newcomer to start!
      setTotalCoins(50);
    }

    const storedName = localStorage.getItem('tezlik_poygasi_player_name');
    if (storedName) {
      setPlayerName(storedName);
    }

    const storedCarId = localStorage.getItem('tezlik_poygasi_equipped_car');
    if (storedCarId) {
      const found = VEHICLES.find((v) => v.id === storedCarId);
      if (found) {
        setSelectedVehicle(found);
      }
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 15); // max 15 chars limit
    setPlayerName(val);
    localStorage.setItem('tezlik_poygasi_player_name', val);
  };

  const handleCoinsChange = (newCoins: number) => {
    setTotalCoins(newCoins);
    localStorage.setItem('tezlik_poygasi_coins', newCoins.toString());
  };

  const handleCarEquip = (v: Vehicle) => {
    setSelectedVehicle(v);
    localStorage.setItem('tezlik_poygasi_equipped_car', v.id);
  };

  const toggleSoundMute = () => {
    const currentMute = soundManager.toggleMute();
    setIsMuted(currentMute);
  };

  // Callback when player crashes or runs out of gas
  const triggerGameOver = (score: number, distance: number, coins: number) => {
    setFinalScores({ score, distance, coins });
    setCurrentView(GameView.GAMEOVER);
    
    // Add collected coins to overall player persistent balance!
    const updatedCoins = totalCoins + coins;
    handleCoinsChange(updatedCoins);
  };

  // Callback when player completes all 3 laps successfully!
  const triggerVictory = (score: number, distance: number, coins: number) => {
    setFinalScores({ score, distance, coins });
    setCurrentView(GameView.VICTORY);

    // Add collected coins to overall persistent balance with a +200 coins victory bonus!
    const updatedCoins = totalCoins + coins + 200;
    handleCoinsChange(updatedCoins);
  };

  // Commit GameOver results to persistent local high score leaderboard
  const saveRecordToLeaderboard = () => {
    const newRecord: ScoreRecord = {
      id: `record_${Date.now()}`,
      playerName: playerName || 'Anons',
      score: finalScores.score,
      distance: finalScores.distance,
      coins: finalScores.coins,
      carName: selectedVehicle.name,
      trackType: selectedTrack,
      date: new Date().toISOString().split('T')[0]
    };

    const existingScoresRaw = localStorage.getItem('tezlik_poygasi_scores');
    let scores: ScoreRecord[] = [];
    if (existingScoresRaw) {
      try {
        scores = JSON.parse(existingScoresRaw) as ScoreRecord[];
      } catch (e) {
        scores = [];
      }
    }

    scores.push(newRecord);
    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);
    // Trim to top 15 records
    scores = scores.slice(0, 15);

    localStorage.setItem('tezlik_poygasi_scores', JSON.stringify(scores));
    
    // Go direct to leaderboard list view to inspect placement!
    setCurrentView(GameView.LEADERBOARD);
  };

  const getTrackVisualDetails = (type: TrackType) => {
    switch (type) {
      case TrackType.DESERT:
        return {
          title: 'Qizilqum Sahrosi',
          desc: 'Issiq va quyoshli choʻl shossesi, balandroq tezlik uchun kurash!',
          bg: 'from-amber-600 via-orange-900 to-yellow-950',
          emoji: '🏜️',
          border: 'border-orange-500/20'
        };
      case TrackType.NEON_NIGHT:
        return {
          title: 'Synthwave Kechasi',
          desc: 'Neon chiroqlari va retro-grid bilan boyitilgan tungi shahar simulyatsiyasi.',
          bg: 'from-purple-950 via-fuchsia-950 to-slate-950',
          emoji: '🌌',
          border: 'border-fuchsia-500/20'
        };
      case TrackType.CITY:
      default:
        return {
          title: 'Toshkent Koʻchalari',
          desc: 'Kunduzgi shahar yoʻli, yashil daraxtlar va klassik bino manzaralari.',
          bg: 'from-blue-900 via-slate-900 to-emerald-950',
          emoji: '🏙️',
          border: 'border-blue-500/20'
        };
    }
  };

  const trackDetails = getTrackVisualDetails(selectedTrack);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${trackDetails.bg} text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans`}>
      
      {/* Universal Floating Settings Control Rail */}
      <div id="settings-quick-rail" className="w-full max-w-4xl flex items-center justify-between mb-4 z-40">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-xl flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <span className="font-bold tracking-tight text-xs uppercase text-slate-300">Tezlik Poygasi 2D</span>
          </div>
        </div>

        {/* Mute switcher + Profile summary */}
        <div className="flex items-center gap-3">
          {/* Audio controller */}
          <button
            onClick={toggleSoundMute}
            className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-black/60 transition shadow-md active:scale-95"
            title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>

          {/* Wallet summary */}
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-sm text-yellow-400 font-mono text-xs font-semibold">
            <Coins className="w-4 h-4 animate-bounce" />
            <span>{totalCoins} <span className="text-[10px] text-slate-400 font-normal">💰</span></span>
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC VIEWS WITH MOOOD TRANSITIONS */}
      
      {/* 1. MAIN MENU VIEW */}
      {currentView === GameView.MENU && (
        <div id="menu-view" className="w-full max-w-2xl bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-lg flex flex-col gap-6 animate-fade-in relative overflow-hidden">
          {/* Beautiful glowing diagonal vectors on bottom */}
          <div className="absolute -bottom-24 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-24 -right-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Central arcade branding */}
          <div className="text-center py-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-lg border border-yellow-300/20 mb-3 animate-[pulse_3s_infinite]">
              <Car className="w-9 h-9 text-slate-950" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400">
              TEZLIK POYGASI
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-sm">
              Retro arcade uslubidagi yuqori tezlikda boshqariladigan dinamik poyga tushumi
            </p>
          </div>

          {/* Name Settings Profile Block */}
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 bg-slate-800 rounded-xl text-slate-400 shrink-0">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <div className="w-full sm:w-auto">
                <label className="text-[10px] text-slate-400 font-mono tracking-widest block uppercase">Poygachi profili</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={handleNameChange}
                  className="bg-transparent font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-400 border-b border-transparent text-sm w-full sm:w-44 h-7"
                  placeholder="Ismingizni kiriting..."
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1 shrink-0 self-start sm:self-center">
              <span>Hulk: {totalCoins} tanga</span>
            </div>
          </div>

          {/* Track Selection Grid Slider */}
          <div className="space-y-2.5">
            <label className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block">Xaritani tanlang</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[TrackType.CITY, TrackType.DESERT, TrackType.NEON_NIGHT].map((type) => {
                const isSelected = selectedTrack === type;
                const details = getTrackVisualDetails(type);

                return (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedTrack(type);
                      soundManager.playCoinSound();
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-slate-900 border-amber-500 text-white shadow-lg' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 text-slate-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">{details.emoji}</div>
                    <div className={`font-bold text-xs ${isSelected ? 'text-amber-400' : 'text-slate-300'}`}>
                      {details.title}
                    </div>
                    <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-tight">
                      {details.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Car equipped showcase strip */}
          <div className="bg-slate-900/40 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Proc badge */}
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-2xl"
                style={{ backgroundColor: selectedVehicle.color }}
              >
                🏎️
              </div>
              
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono block">Saylangan mashina</span>
                <span className="font-bold text-slate-200 text-xs sm:text-sm">{selectedVehicle.name}</span>
                <span className="text-[10px] text-slate-400 font-mono block sm:inline sm:ml-2">Tezlik: {selectedVehicle.speed * 10} km/h</span>
              </div>
            </div>

            <button
              onClick={() => setCurrentView(GameView.GARAGE)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition"
            >
              Mashina almashtirish
            </button>
          </div>

          {/* Action Center Play button and secondary buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
            <button
              onClick={() => {
                setCurrentView(GameView.PLAYING);
                setIsPaused(false);
                soundManager.startEngine();
              }}
              className="sm:col-span-2 py-4 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 active:scale-[0.99] transition font-black text-slate-950 font-sans text-base tracking-wide rounded-2xl flex items-center justify-center gap-2.5 shadow-xl hover:shadow-amber-500/10"
            >
              <Play className="w-5 h-5 fill-slate-950 text-slate-950 stroke-[2.5]" />
              POYGANI BOSHLASH !
            </button>

            <button
              onClick={() => setCurrentView(GameView.LEADERBOARD)}
              className="py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-750 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Natija & Rekordlar
            </button>

            <button
              onClick={() => setCurrentView(GameView.HELP)}
              className="py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-750 border border-slate-800 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Qoidalar & Boshqarish
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE PLAYING VIEW (HUD & GAME CANVAS THREAD) */}
      {currentView === GameView.PLAYING && (
        <div id="playing-view" className="w-full max-w-2xl flex flex-col gap-4 animate-fade-in relative z-20">
          
          {/* HEADING RUN HUDS */}
          <div id="stats-hud" className="bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
            
            {/* Score & distance ticker */}
            <div className="flex gap-4 sm:gap-6">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Natija</label>
                <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400 tracking-tight leading-none mt-1">
                  {hudStats.score.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Yurilgan yol</label>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-200 tracking-tight leading-none mt-1">
                  {hudStats.distance} <span className="text-xs text-slate-400 font-normal">m</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Tangalar</label>
                <div className="text-xl sm:text-2xl font-black font-mono text-yellow-400 tracking-tight leading-none mt-1">
                  {hudStats.coins} <span className="text-xs">💰</span>
                </div>
              </div>
            </div>

            {/* Speeder speedometer digital design */}
            <div className="text-right flex items-center gap-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-mono block">Spidometr</label>
                <div className="text-2xl font-black font-mono text-orange-400 tracking-tight leading-none mt-1">
                  {hudStats.speed} <span className="text-xs font-normal text-slate-400">km/h</span>
                </div>
              </div>

              {/* Pause Toggle */}
              <button
                onClick={() => {
                  setIsPaused(!isPaused);
                  if (!isPaused) {
                    soundManager.stopEngine();
                  } else {
                    soundManager.startEngine();
                  }
                }}
                className={`p-3 rounded-2xl transition border ${
                  isPaused 
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Pause"
              >
                {isPaused ? <Play className="w-4 h-4 fill-current shrink-0" /> : <Pause className="w-4 h-4 shrink-0" />}
              </button>
            </div>
          </div>

          {/* Action stats sub-HUD bar (Aylana, O'rin, O'q) */}
          <div id="action-hud" className="bg-slate-950/85 border border-slate-850 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3 text-slate-100 backdrop-blur-md">
            <div className="flex gap-4 sm:gap-6 items-center">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono block">🏁 AYLANA (LAP)</span>
                <div className="text-lg font-black font-mono text-emerald-400 mt-0.5 animate-pulse">
                  {hudStats.lap || 1} <span className="text-xs font-normal text-slate-400">/ 3</span>
                </div>
              </div>

              <div className="border-l border-slate-800 h-6" />

              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono block">🏆 POSITION (STAND)</span>
                <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
                  {hudStats.position || 5} <span className="text-xs font-semibold text-slate-400 lowercase">-o'rin</span>
                </div>
              </div>

              <div className="border-l border-slate-800 h-6" />

              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono block">🔫 O'QLARIMIZ (AMMO)</span>
                <div className="text-lg font-black font-mono text-orange-400 mt-0.5">
                  {hudStats.bulletsCount} <span className="text-[10px] text-slate-500 font-normal">dona</span>
                </div>
              </div>
            </div>

            {/* Shoot Action trigger button */}
            <button
              id="touch-weapon-shoot-indicator"
              onClick={() => {
                const canvasEl = document.getElementById('retro-game-canvas');
                if (canvasEl) {
                  canvasEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                }
              }}
              disabled={hudStats.bulletsCount <= 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition relative flex items-center gap-1.5 leading-none shrink-0 border cursor-pointer ${
                hudStats.bulletsCount > 0
                  ? 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-md hover:shadow-red-500/20 active:scale-95'
                  : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
              O'Q OTISH! (F / J)
            </button>
          </div>

          {/* FUEL LIFE-METER BAR */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl px-5 py-3.5 flex items-center gap-4">
            <span className="text-red-400 flex items-center gap-1.5 text-xs font-bold leading-none select-none">
              <Flame className="w-4 h-4 text-red-500 animate-pulse shrink-0" /> 
              YOQILG'I
            </span>
            
            <div className="h-4 bg-slate-900 rounded-full flex-1 overflow-hidden p-[2px] border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hudStats.fuel > 30 
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-400' 
                    : 'bg-gradient-to-r from-red-600 to-amber-500 animate-pulse'
                }`}
                style={{ width: `${hudStats.fuel}%` }}
              />
            </div>

            <div className="font-mono text-xs font-semibold text-slate-300 w-10 text-right shrink-0">
              {hudStats.fuel}%
            </div>
          </div>

          {/* Dynamic Active Alerts Banner Overlays */}
          {(hudStats.isTurbo || hudStats.isSpun || isPaused || hudStats.fuel <= 25) && (
            <div className="inset-x-0 mx-auto w-full flex flex-col gap-2 z-30 animate-fade-in text-center">
              {isPaused && (
                <div className="py-3 bg-amber-500/90 border border-amber-400 text-slate-950 font-sans font-black text-xs uppercase tracking-widest rounded-xl shadow-lg">
                  ⏸️ O'YIN TO'XTATILDI ! BOSHLASH UCHUN PLAY TUGMASINI BOSING
                </div>
              )}
              {hudStats.isTurbo && (
                <div className="py-3 bg-fuchsia-600 border border-fuchsia-400 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-fuchsia-500/25 flex items-center justify-center gap-2 animate-bounce">
                  <Sparkles className="w-4 h-4 fill-white" />
                  TURBO REJIM FAOL! SIZ DAXLSIZSIZ ! ({(hudStats.turboTimeRemaining / 1000).toFixed(1)}s)
                </div>
              )}
              {hudStats.isSpun && (
                <div className="py-3 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4 animate-spin" />
                  MASHINA SIRPANMOQDA! MOSHLIKDAN CHIQING !
                </div>
              )}
              {hudStats.fuel <= 25 && !hudStats.isTurbo && (
                <div className="py-2.5 bg-red-500/20 border border-red-500/50 text-red-300 font-bold text-[11px] uppercase tracking-widest rounded-xl animate-pulse">
                  ⚠️ OGOHLANTIRISH! Yoqilg'i tugamoqda! Benzin kanistrini yig'ing!
                </div>
              )}
            </div>
          )}

          {/* HTML5 Rendering engine component viewport */}
          <GameCanvas
            trackType={selectedTrack}
            vehicle={selectedVehicle}
            isPaused={isPaused}
            onStatsChange={setHudStats}
            onGameOver={triggerGameOver}
            onVictory={triggerVictory}
            playerName={playerName}
          />

          {/* Exit option inside active screen */}
          <div className="flex justify-center mt-1">
            <button
              onClick={() => {
                if (window.confirm("Haqiqatdan ham poygani yakunlab bosh menyuga qaytishga rozimisiz?")) {
                  soundManager.stopEngine();
                  setCurrentView(GameView.MENU);
                }
              }}
              className="px-5 py-2 hover:bg-red-500/10 text-xs text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-xl transition font-semibold"
            >
              Poygadan chiqish (Bosh menyu)
            </button>
          </div>
        </div>
      )}

      {/* 3. AVTOSALON / GARAGE VIEW */}
      {currentView === GameView.GARAGE && (
        <Garage
          selectedVehicle={selectedVehicle}
          onSelectVehicle={handleCarEquip}
          onBackToMenu={() => setCurrentView(GameView.MENU)}
          totalCoins={totalCoins}
          onCoinsChange={handleCoinsChange}
        />
      )}

      {/* 4. LEADERBOARD LIST VIEW */}
      {currentView === GameView.LEADERBOARD && (
        <LeaderboardList onBackToMenu={() => setCurrentView(GameView.MENU)} />
      )}

      {/* 5. GAME OVER SUMMARY SCORECARD SHEET */}
      {currentView === GameView.GAMEOVER && (
        <div id="gameover-view" className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-lg animate-fade-in relative overflow-hidden">
          {/* Flame details */}
          <div className="w-16 h-16 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-[bounce_2s_infinite]">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <p className="text-xs text-red-400 uppercase tracking-widest font-mono font-bold">OYIN YAKUNLANDI</p>
          <h2 className="text-3xl font-black font-sans text-slate-100 tracking-tight mt-1">
            POYGA TUGADI !
          </h2>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
            {finalScores.distance > 100 
              ? 'Ajoyib natija! Siz yoʻllardagi toʻsiqlarni mahorat bilan zabt etdingiz!' 
              : 'Oila koʻproq harakat qiling, yoʻldagi toʻsiqlardan ehtiyot boʻling.'}
          </p>

          {/* Performance scorecard sheet statistics */}
          <div className="grid grid-cols-3 gap-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 my-6">
            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Masofa</div>
              <div className="text-base font-black text-slate-200 mt-0.5">{finalScores.distance}m</div>
            </div>
            
            <div className="text-center border-x border-slate-800/60">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Tangalar</div>
              <div className="text-base font-black text-yellow-400 mt-0.5">+{finalScores.coins} 💰</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] text-slate-500 uppercase font-mono">Umumiy Ball</div>
              <div className="text-xl font-mono font-black text-cyan-400 mt-0.5">{finalScores.score.toLocaleString()}</div>
            </div>
          </div>

          {/* Record Commit Box */}
          <div className="space-y-4 pt-1 mb-8">
            <div className="text-left bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <label className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block mb-1">Poygachi ismingiz</label>
              <input
                type="text"
                value={playerName}
                onChange={handleNameChange}
                className="bg-transparent font-bold text-slate-100 focus:outline-none border-b border-slate-700 focus:border-cyan-400 text-sm w-full h-8 px-1 pb-1"
                placeholder="Ismingizni qoldiring..."
              />
            </div>

            <button
              onClick={saveRecordToLeaderboard}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] hover:shadow-cyan-500/20 shadow-lg text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl transition"
            >
              🛡️ REKORDLAR RO'YXATIGA SAQLASH
            </button>
          </div>

          {/* Action options buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900/60">
            <button
              onClick={() => {
                setCurrentView(GameView.PLAYING);
                setIsPaused(false);
                soundManager.startEngine();
              }}
              className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-500" />
              Yana urinish
            </button>

            <button
              onClick={() => setCurrentView(GameView.MENU)}
              className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 text-cyan-500" />
              Bosh sahifa
            </button>
          </div>
        </div>
      )}

      {/* 6. HELP VIEW (RULES AND CONTROLS EXPLANATIONS) */}
      {currentView === GameView.HELP && (
        <div id="help-view" className="w-full max-w-2xl bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-slate-100 animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">O'yin qoidalari va Boshqarish</h2>
              <p className="text-xs text-slate-400">Tezlik poygasi darsligi</p>
            </div>
          </div>

          {/* Content Body divides into Controls vs Collectibles list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed text-sm">
            
            {/* Keyboard layout panel */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-900 pb-1 flex items-center gap-1.5">
                ⌨️ Klaviatura Tugmasi boshqaruvi
              </h3>

              <div className="space-y-3.5">
                {/* Control Action 1 */}
                <div className="flex items-start gap-3">
                  <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-750 text-cyan-400 rounded-md font-mono text-xs shadow-inner uppercase shrink-0">
                    ▲ yoki W / Space
                  </kbd>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold block">Tezlashish (Gaz)</span>
                    Mashina tezligini oshiradi.
                  </div>
                </div>

                {/* Control Action 2 */}
                <div className="flex items-start gap-3">
                  <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-750 text-cyan-400 rounded-md font-mono text-xs shadow-inner uppercase shrink-0">
                    ▼ yoki S
                  </kbd>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold block">Sekinlashish / Tormoz</span>
                    Zarur hollarda to'siqlardan qochish uchun tormozni bosing.
                  </div>
                </div>

                {/* Control Action 3 */}
                <div className="flex items-start gap-3">
                  <kbd className="px-2.5 py-1 bg-slate-900 border border-slate-750 text-cyan-400 rounded-md font-mono text-xs shadow-inner uppercase shrink-0">
                    ◀ ▶ yoki A D
                  </kbd>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold block">Sariq burilish</span>
                    Avtomobilni chap va o'ng qatorga yo'naltiradi.
                  </div>
                </div>
              </div>

              {/* Touch info */}
              <div className="bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl text-[11px] text-slate-400 leading-normal">
                📱 <strong>Mobil yoki planshetda:</strong> Ekranning chap burchagini bosish chapga, o'ng tarafi o'ngga buradi. Gaz berish avtomatik bajariladi.
              </div>
            </div>

            {/* Collectibles list */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-200 border-b border-slate-900 pb-1 flex items-center gap-1.5">
                🚦 Yo'ldagi narsalar turlari
              </h3>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-xl">
                  <span className="text-xl">💰</span>
                  <div>
                    <strong>Oltin tanga:</strong> Ball beradi va yangi Cobalt yoki Gentra olish uchun uning balansini toʻldiradi.
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-xl">
                  <span className="text-xl">⛽</span>
                  <div>
                    <strong>Benzin kanistri (Yoqilg'i):</strong> Yoqilg'ini +25% ga to'ldiradi. Yoqilg'i tugasa o'yin tugaydi!
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-xl">
                  <span className="text-xl">⭐</span>
                  <div>
                    <strong>Turbo yulduzi:</strong> 5 soniyali daxlsizlik va o'ta tezlik. To'siqlarni blast qilib urib ketasiz!
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-xl">
                  <span className="text-xl">🛢️</span>
                  <div>
                    <strong>Moy izlari (Oil):</strong> Avtomobil bir lahzaga boshqaruvni yo'qotadi va spin aylanadi.
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-xl bg-red-950/10 border border-red-500/10">
                  <span className="text-xl">🚧</span>
                  <div>
                    <strong>G'ov (Barrier) / Mashinalar:</strong> To'qnashuvda yoqilg'i darajasi tushib, katta tezlik yo'qoladi!
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2 bg-slate-900/40 rounded-xl bg-blue-950/20 border border-blue-500/25">
                  <span className="text-xl">⚡</span>
                  <div>
                    <strong>Ammo clips (Qurol o'qi):</strong> Yo'lda tarqalgan o'qlik konteyneri. Sizga +5 o'q beradi, dushman moshinalarini otib portlating!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action Navigation */}
          <div className="mt-8 flex justify-center border-t border-slate-800 pb-1 pt-5">
            <button
              onClick={() => setCurrentView(GameView.MENU)}
              className="w-full sm:w-auto px-12 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 hover:text-white font-medium rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
            >
              Tushundim, Asosiy Menyuga
            </button>
          </div>
        </div>
      )}

      {/* 5.5 POYGA G'OLIBI VICTORY CUP CHAMPIONSHIP SCREEN */}
      {currentView === GameView.VICTORY && (
        <div id="victory-view" className="w-full max-w-md bg-slate-950/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(234,179,8,0.15)] text-center backdrop-blur-lg animate-fade-in relative overflow-hidden">
          {/* Confetti layout glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

          {/* Majestic Animated Gold Trophy Cup */}
          <div className="w-24 h-24 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-[bounce_2.5s_infinite]">
            <Trophy className="w-12 h-12 text-slate-950 stroke-[2.5]" />
          </div>

          <span className="px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-400 text-[10px] uppercase tracking-widest font-mono font-bold">
            CHAMPION CUP WINNER!
          </span>
          <h2 className="text-3xl font-black font-sans text-amber-100 tracking-tight mt-3">
            G'ALABA QOZONDINGIZ !
          </h2>
          <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">
            Tabriklaymiz, <span className="text-emerald-400 font-bold">{playerName}</span>! Siz 3 ta aylanani muvaffaqiyatli bosib o'tdingiz va finish chizig'ini marra qilib kesib o'tdingiz!
          </p>

          {/* Performance scorecard sheet statistics */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 my-6">
            <div className="text-center">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Natija</span>
              <span className="text-base sm:text-lg font-black font-mono text-cyan-400 mt-0.5 block">
                {finalScores.score.toLocaleString()}
              </span>
            </div>
            
            <div className="text-center border-l border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Yo'l</span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-200 mt-0.5 block">
                {Math.round(finalScores.distance)} <span className="text-xs text-slate-400 font-normal">m</span>
              </span>
            </div>

            <div className="text-center border-l border-slate-800">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Tangalar</span>
              <span className="text-base sm:text-lg font-black font-mono text-yellow-400 mt-0.5 block">
                +{finalScores.coins} 💰
              </span>
            </div>
          </div>

          {/* Championship prize badge notification */}
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-semibold flex items-center justify-center gap-2">
            🥇 G'oliblik Bonusi: <span className="text-amber-400 font-black text-sm animate-pulse">+200 Oltin Tanga!</span>
          </div>

          <div className="space-y-3 mb-4">
            <button
              onClick={saveRecordToLeaderboard}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] font-black text-slate-950 text-xs uppercase tracking-widest rounded-2xl transition shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
            >
              🏆 REKORDLAR RO'YXATIGA SAQLASH
            </button>
          </div>

          {/* Action options buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-900/60">
            <button
              onClick={() => {
                setCurrentView(GameView.PLAYING);
                setIsPaused(false);
                soundManager.startEngine();
              }}
              className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-emerald-500 animate-spin" />
              Yana poyga
            </button>

            <button
              onClick={() => setCurrentView(GameView.MENU)}
              className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 text-cyan-500" />
              Asosiy Menyu
            </button>
          </div>
        </div>
      )}

      {/* Embedded decorative global CSS for custom simple animations and scrollbars */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(30, 41, 59, 1);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(51, 65, 85, 1);
        }
      `}</style>
    </div>
  );
}
