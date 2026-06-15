import { Vehicle } from '../types';

export const VEHICLES: Vehicle[] = [
  {
    id: 'tiko',
    name: 'Tiko - "Afsona"',
    desc: 'O\'ta chaqqon, kichik teshiklardan ham o\'tadi. Kam yoqilg\'i sarflaydigan shahar qahramoni.',
    speed: 4,
    handling: 10,
    fuelEfficiency: 9,
    color: '#ffdd00', // Yellow
    accentColor: '#1a1a1a', // Black accents
    price: 0
  },
  {
    id: 'cobalt',
    name: 'Cobalt - "Ishonch"',
    desc: 'Mukammal darajadagi balans. Boshqarilishi yumshoq va har qanday yo\'lga chidamli.',
    speed: 6,
    handling: 7,
    fuelEfficiency: 7,
    color: '#708090', // Metallic Silver
    accentColor: '#0052cc', // Blue accents
    price: 150
  },
  {
    id: 'gentra',
    name: 'Gentra - "Elegant"',
    desc: 'Haqiqiy afsonaviy lyuks ko\'rinish. Tezligi va dinamikasi yuqori darajada.',
    speed: 8,
    handling: 8,
    fuelEfficiency: 5,
    color: '#ffffff', // Clean White
    accentColor: '#ff0055', // Red sports stripes
    price: 350
  },
  {
    id: 'turbo_dev',
    name: 'Supercar - "Turbo Dev"',
    desc: 'O\'ta yuqori tezlik va agressiv dizayn. Yoqilg\'ini tez tugatadi, lekin cheksiz tezlik bera oladi!',
    speed: 10,
    handling: 6,
    fuelEfficiency: 3.5,
    color: '#111111', // Matte Black
    accentColor: '#00ff66', // Neon green trim
    price: 700
  }
];
