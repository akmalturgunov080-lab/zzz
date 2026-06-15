import React, { useEffect, useState } from 'react';
import { ScoreRecord, TrackType } from '../types';
import { Trophy, Calendar, Car, Tag, Trash2 } from 'lucide-react';

interface LeaderboardListProps {
  onBackToMenu: () => void;
}

const DEFAULT_SCORES: ScoreRecord[] = [
  {
    id: 'def_1',
    playerName: 'Sardor Macho',
    score: 12500,
    distance: 420,
    coins: 84,
    carName: 'Supercar - "Turbo Dev"',
    trackType: TrackType.NEON_NIGHT,
    date: '2026-06-01'
  },
  {
    id: 'def_2',
    playerName: 'Malika Gentra',
    score: 8750,
    distance: 310,
    coins: 55,
    carName: 'Gentra - "Elegant"',
    trackType: TrackType.CITY,
    date: '2026-06-03'
  },
  {
    id: 'def_3',
    playerName: 'Tiko Boy',
    score: 6400,
    distance: 285,
    coins: 98,
    carName: 'Tiko - "Afsona"',
    trackType: TrackType.DESERT,
    date: '2026-06-04'
  },
  {
    id: 'def_4',
    playerName: 'Cobalt Aka',
    score: 4100,
    distance: 190,
    coins: 30,
    carName: 'Cobalt - "Ishonch"',
    trackType: TrackType.CITY,
    date: '2026-05-29'
  }
];

export const LeaderboardList: React.FC<LeaderboardListProps> = ({ onBackToMenu }) => {
  const [records, setRecords] = useState<ScoreRecord[]>([]);

  useEffect(() => {
    const rawData = localStorage.getItem('tezlik_poygasi_scores');
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData) as ScoreRecord[];
        // Sort descending by score
        const sorted = parsed.sort((a, b) => b.score - a.score);
        setRecords(sorted);
      } catch (e) {
        setRecords(DEFAULT_SCORES);
      }
    } else {
      // Set default scores and save to storage
      localStorage.setItem('tezlik_poygasi_scores', JSON.stringify(DEFAULT_SCORES));
      setRecords(DEFAULT_SCORES);
    }
  }, []);

  const clearScores = () => {
    if (window.confirm("Haqiqatdan ham barcha rekordlar ro'yxatini tozalashni xohlaysizmi?")) {
      localStorage.removeItem('tezlik_poygasi_scores');
      setRecords([]);
    }
  };

  const getTrackNameUz = (type: TrackType) => {
    switch (type) {
      case TrackType.CITY:
        return 'Toshkent kochalari (Shahar)';
      case TrackType.DESERT:
        return 'Qizilqum sahrosi (Desert)';
      case TrackType.NEON_NIGHT:
        return 'Retro Neon Kechasi';
      default:
        return 'Asosiy yol';
    }
  };

  return (
    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white animate-fade-in">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-sans tracking-tight">Peshqadamlar Jadvali</h2>
            <p className="text-xs text-slate-400">Eng yuqori ornatilgan rekordlar</p>
          </div>
        </div>

        {records.length > 0 && (
          <button
            onClick={clearScores}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 active:bg-red-500/20 border border-red-500/20 rounded-xl transition"
            title="Tozalash"
          >
            <Trash2 className="w-4 h-4" />
            Tozalash
          </button>
        )}
      </div>

      {/* Record Table / List */}
      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p>Hozircha hech qanday natijalar mavjud emas.</p>
            <p className="text-xs mt-1">Yangi oʻyinni boshlang va birinchi rekordni oʻrnating!</p>
          </div>
        ) : (
          records.map((record, index) => {
            const isTop3 = index < 3;
            const rankColors = [
              'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950', // 1st
              'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950', // 2nd
              'bg-gradient-to-r from-amber-600 to-amber-700 text-white',     // 3rd
            ];

            return (
              <div
                key={record.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/60 border ${
                  isTop3 ? 'border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-slate-900'
                } rounded-2xl gap-3 sm:gap-2`}
              >
                {/* User & Rank Info */}
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center font-bold font-mono text-sm ${
                      isTop3 ? rankColors[index] : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                      {record.playerName}
                      {isTop3 && index === 0 && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">AFSONA</span>}
                    </h3>
                    
                    {/* Sub details */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Car className="w-3.5 h-3.5 text-blue-400" />
                        {record.carName}
                      </span>
                      <span className="hidden sm:inline text-slate-600">•</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-orange-400" />
                        {getTrackNameUz(record.trackType)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance stats & score */}
                <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-slate-900/50 sm:border-0 pt-2.5 sm:pt-0">
                  {/* Stats (coins & distance) */}
                  <div className="text-right flex items-center sm:flex-col gap-4 sm:gap-0 font-mono text-[11px] text-slate-400">
                    <div>
                      Masofa: <span className="text-slate-200">{record.distance}m</span>
                    </div>
                    <div>
                      Tangalar: <span className="text-yellow-400 font-semibold">{record.coins}💰</span>
                    </div>
                  </div>

                  {/* Ultimate Score */}
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Ball</div>
                    <div className="text-xl font-black font-mono text-cyan-400 tracking-tight">
                      {record.score.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex justify-center border-t border-slate-800/80 pt-5">
        <button
          onClick={onBackToMenu}
          className="w-full sm:w-auto px-10 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 hover:text-white font-medium rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
        >
          Asosiy Menyuga Qaytish
        </button>
      </div>
    </div>
  );
};
