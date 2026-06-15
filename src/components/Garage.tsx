import React, { useEffect, useState } from 'react';
import { Vehicle } from '../types';
import { VEHICLES } from '../data/vehicles';
import { Car, Lock, Flame, ShieldAlert, Zap, Coins, Check } from 'lucide-react';

interface GarageProps {
  selectedVehicle: Vehicle;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onBackToMenu: () => void;
  totalCoins: number;
  onCoinsChange: (newCoins: number) => void;
}

export const Garage: React.FC<GarageProps> = ({
  selectedVehicle,
  onSelectVehicle,
  onBackToMenu,
  totalCoins,
  onCoinsChange
}) => {
  const [unlockedVehicles, setUnlockedVehicles] = useState<string[]>(['tiko']);

  useEffect(() => {
    const rawUnlocked = localStorage.getItem('tezlik_poygasi_unlocked_cars');
    if (rawUnlocked) {
      try {
        setUnlockedVehicles(JSON.parse(rawUnlocked) as string[]);
      } catch (e) {
        setUnlockedVehicles(['tiko']);
      }
    } else {
      localStorage.setItem('tezlik_poygasi_unlocked_cars', JSON.stringify(['tiko']));
    }
  }, []);

  const purchaseVehicle = (vehicle: Vehicle) => {
    if (totalCoins < vehicle.price) {
      alert(`Kechirasiz, sizda yetarli mablag' mavjud emas!\nSizda: ${totalCoins} 💰\nKerak: ${vehicle.price} 💰`);
      return;
    }

    const updatedUnlocked = [...unlockedVehicles, vehicle.id];
    setUnlockedVehicles(updatedUnlocked);
    localStorage.setItem('tezlik_poygasi_unlocked_cars', JSON.stringify(updatedUnlocked));
    
    // Deduct coins
    const leftCoins = totalCoins - vehicle.price;
    onCoinsChange(leftCoins);
    
    // Auto select newly unlocked car
    onSelectVehicle(vehicle);
  };

  const isUnlocked = (id: string) => unlockedVehicles.includes(id);

  // Simple procedural vector drawing representation inside UI using inline SVGs to match the high-fidelity standard
  const renderCarSVG = (v: Vehicle) => {
    return (
      <svg viewBox="0 0 100 60" className="w-full h-24 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
        {/* Wheels */}
        <rect x="18" y="5" width="10" height="6" rx="2" fill="#111111" />
        <rect x="72" y="5" width="10" height="6" rx="2" fill="#111111" />
        <rect x="18" y="49" width="10" height="6" rx="2" fill="#111111" />
        <rect x="72" y="49" width="10" height="6" rx="2" fill="#111111" />
        
        {/* Mirror Details */}
        <rect x="35" y="4" width="4" height="4" rx="1" fill={v.color} />
        <rect x="35" y="52" width="4" height="4" rx="1" fill={v.color} />

        {/* Chassis Body */}
        <rect x="23" y="9" width="54" height="42" rx="10" fill={v.color} />

        {/* Stripes */}
        <rect x="23" y="19" width="54" height="4" fill={v.accentColor} />
        <rect x="23" y="37" width="54" height="4" fill={v.accentColor} />

        {/* Windshield Cabin */}
        <polygon points="38,13 65,13 72,18 72,42 65,47 38,47 33,40 33,20" fill="#b3e5fc" opacity="0.9" />
        
        {/* Cabin Divider */}
        <rect x="48" y="13" width="3" height="34" fill="#263238" />

        {/* Front Yellow Headlights */}
        <rect x="75" y="12" width="3" height="6" rx="1" fill="#fff59d" />
        <rect x="75" y="42" width="3" height="6" rx="1" fill="#fff59d" />

        {/* Rear Red Brakelights */}
        <rect x="22" y="14" width="2" height="6" fill="#f44336" />
        <rect x="22" y="40" width="2" height="6" fill="#f44336" />

        {/* Spoiler rear wing in sport style */}
        {(v.id === 'turbo_dev' || v.id === 'gentra') && (
          <g>
            <rect x="17" y="11" width="3" height="38" fill={v.accentColor} />
            <rect x="15" y="9" width="6" height="3" fill="#111" />
            <rect x="15" y="48" width="6" height="3" fill="#111" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-white animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-sans tracking-tight">Avtosalon & Garaj</h2>
            <p className="text-xs text-slate-400">Poyga uchun kerakli mashinani harid qiling yoki tanlang</p>
          </div>
        </div>

        {/* Coins indicator */}
        <div className="bg-slate-950 px-5 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-3 self-start sm:self-center">
          <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Sizning Balansingiz</div>
            <div className="text-lg font-bold font-mono text-yellow-400">
              {totalCoins} <span className="text-xs font-normal text-slate-400">tanga</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Garage Grid splits car list on left, detail cards on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
        {/* Car Select List (Left Col) */}
        <div className="md:col-span-5 space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {VEHICLES.map((v) => {
            const currentSelected = selectedVehicle.id === v.id;
            const unlocked = isUnlocked(v.id);

            return (
              <button
                key={v.id}
                onClick={() => unlocked && onSelectVehicle(v)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  currentSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : unlocked
                    ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200'
                    : 'bg-slate-950/20 border-slate-950 text-slate-500 cursor-not-allowed opacity-75'
                }`}
                disabled={!unlocked && selectedVehicle.id === v.id}
              >
                <div className="flex items-center gap-3.5">
                  {/* Miniature color blob */}
                  <div
                    className="w-8 h-8 rounded-xl shrink-0 border border-white/20 flex items-center justify-center font-bold text-lg shadow-inner"
                    style={{ backgroundColor: v.color, color: v.color === '#ffffff' ? '#111' : '#fff' }}
                  >
                    🚗
                  </div>
                  <div>
                    <h4 className="font-semibold">{v.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">
                      {v.price === 0 ? 'Boshlang\'ich' : `Narxi: ${v.price} 💰`}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {currentSelected ? (
                    <span className="bg-blue-500 text-slate-900 rounded-full p-1 block">
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </span>
                  ) : unlocked ? (
                    <span className="text-[10px] text-blue-400 uppercase font-mono font-semibold">TAYYOR</span>
                  ) : (
                    <span className="text-amber-500 p-1 block">
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Car Specs Sheet (Right Col) */}
        <div className="md:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col h-full justify-between gap-6">
          {/* Visual Display */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-900/60 rounded-xl relative overflow-hidden group">
            {/* Ambient visual background glow matching the car's color */}
            <div 
              className="absolute -bottom-12 w-32 h-32 blur-3xl opacity-20 pointer-events-none transition-all duration-300 group-hover:scale-125" 
              style={{ backgroundColor: selectedVehicle.color }}
            />
            
            {renderCarSVG(selectedVehicle)}
            
            <h3 className="text-xl font-bold font-sans tracking-tight mt-5 text-slate-100">
              {selectedVehicle.name}
            </h3>
            <p className="text-xs text-center text-slate-400 mt-2 px-6">
              {selectedVehicle.desc}
            </p>
          </div>

          {/* Interactive Specification Sliders */}
          <div className="space-y-4">
            <h4 className="text-xs text-slate-400 font-mono uppercase tracking-wider">Mashina Texnik Xususiyatlari</h4>

            {/* Spec: Speed */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Flame className="w-4 h-4" /> Maksimal Tezlik
                </span>
                <span className="font-mono">{selectedVehicle.speed * 10} km/h (Kof)</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${selectedVehicle.speed * 10}%` }}
                />
              </div>
            </div>

            {/* Spec: Handling */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Zap className="w-4 h-4" /> Boshqaruv (Burilish)
                </span>
                <span className="font-mono">{selectedVehicle.handling * 10}%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${selectedVehicle.handling * 10}%` }}
                />
              </div>
            </div>

            {/* Spec: Fuel Economy */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-green-400">
                  <ShieldAlert className="w-4 h-4" /> Yoqilg'i Tejamkorligi
                </span>
                <span className="font-mono">{selectedVehicle.fuelEfficiency * 10}%</span>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${selectedVehicle.fuelEfficiency * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Checkout Unlock Button Block */}
          <div className="mt-4 pt-4 border-t border-slate-900/60 flex justify-center">
            {isUnlocked(selectedVehicle.id) ? (
              <div className="w-full text-center py-3 bg-slate-900 border border-slate-800 text-emerald-400 font-bold font-mono text-xs tracking-wider rounded-xl select-none uppercase">
                ✅ Ushbu mashina tanlangan
              </div>
            ) : (
              <button
                onClick={() => purchaseVehicle(selectedVehicle)}
                disabled={totalCoins < selectedVehicle.price}
                className={`w-full py-3.5 px-6 font-bold text-center rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${
                  totalCoins >= selectedVehicle.price
                    ? 'bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-slate-950 font-sans shadow-lg'
                    : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4 text-slate-950" />
                MASHINANI SOTIB OLISH (Hulk: {selectedVehicle.price} 💰)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Close Footer Navigation */}
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
