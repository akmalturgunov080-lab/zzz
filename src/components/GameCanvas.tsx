import React, { useEffect, useRef, useState } from 'react';
import { GameStats, Obstacle, Particle, TrackType, Vehicle, Bullet, Opponent } from '../types';
import { soundManager } from './SoundManager';

interface GameCanvasProps {
  trackType: TrackType;
  vehicle: Vehicle;
  isPaused: boolean;
  onStatsChange: (stats: GameStats) => void;
  onGameOver: (finalScore: number, finalDistance: number, finalCoins: number) => void;
  onVictory: (finalScore: number, finalDistance: number, finalCoins: number) => void;
  playerName: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  trackType,
  vehicle,
  isPaused,
  onStatsChange,
  onGameOver,
  onVictory,
  playerName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard controls state
  const keysRef = useRef<{ [key: string]: boolean }>({});
  
  // Game dimensions state
  const [dimensions, setDimensions] = useState({ width: 600, height: 750 });

  const shootBullet = () => {
    const state = gameStateRef.current;
    if (isPaused || state.isFinished) return;
    if (state.bulletsCount <= 0) return;
    if (state.shootCooldown > 0) return;

    state.bulletsCount--;
    state.shootCooldown = 250; // cooldown of 250ms

    soundManager.playShootSound();

    // instantiates bullet at the top of player car
    const playerY = dimensions.height - 110;
    state.bullets.push({
      id: `bullet_${Date.now()}_${Math.random()}`,
      x: state.playerX,
      y: playerY - 18,
      speed: 15
    });

    // muzzle flash sparks
    const pX = (dimensions.width / 2) + state.playerX * (dimensions.width * 0.26);
    createExplosion(pX, playerY - 30, '#ff3d00', 4);
  };

  // Game continuous state (stored in refs to bypass react rendering overhead inside the animation loop)
  const gameStateRef = useRef<{
    playerX: number;          // -1.2 (left) to 1.2 (right)
    playerTargetX: number;
    roadOffset: number;       // background scrolling offset
    speed: number;            // current pixel speed of scroll
    maxSpeed: number;         // vehicle cap
    acceleration: number;
    deceleration: number;
    steeringForce: number;
    
    score: number;
    distance: number;
    coins: number;
    fuel: number;
    isTurbo: boolean;
    turboTime: number;
    isSpun: boolean;
    spinTime: number;
    spinAngle: number;
    
    curveAngle: number;       // current curve offset for visual effect
    nextCurveAngle: number;
    curveTimer: number;

    obstacles: Obstacle[];
    obstacleTimer: number;
    lastObstacleId: number;

    particles: Particle[];

    // New gameplay systems
    bullets: Bullet[];
    bulletsCount: number;
    shootCooldown: number;
    opponents: Opponent[];
    lap: number;
    isFinished: boolean;
  }>({
    playerX: 0,
    playerTargetX: 0,
    roadOffset: 0,
    speed: 0,
    maxSpeed: 8 + vehicle.speed * 0.7, // scaled speed
    acceleration: 0.15,
    deceleration: 0.08,
    steeringForce: 0.04 + vehicle.handling * 0.003,
    
    score: 0,
    distance: 0,
    coins: 0,
    fuel: 100,
    isTurbo: false,
    turboTime: 0,
    isSpun: false,
    spinTime: 0,
    spinAngle: 0,
    
    curveAngle: 0,
    nextCurveAngle: 0,
    curveTimer: 0,

    obstacles: [],
    obstacleTimer: 0,
    lastObstacleId: 0,

    particles: [],

    // Initialize shooting and racing parameters
    bullets: [],
    bulletsCount: 5,
    shootCooldown: 0,
    opponents: [],
    lap: 1,
    isFinished: false
  });

  // Track specific palettes
  const getThemePalette = () => {
    switch (trackType) {
      case TrackType.DESERT:
        return {
          sky: '#fbc02d',
          dirt: '#e5a93b',
          road: '#2c251d',
          lines: '#ffeb3b',
          accent: '#c1801c',
          bgDetails: ['🌵', '🏜️', '⛰️']
        };
      case TrackType.NEON_NIGHT:
        return {
          sky: '#0b001a',
          dirt: '#1d0033',
          road: '#0d0d1e',
          lines: '#00ffff',
          accent: '#ff007f',
          bgDetails: ['🌴', '🔮', '✨']
        };
      case TrackType.CITY:
      default:
        return {
          sky: '#81d4fa',
          dirt: '#2e7d32', // green grass
          road: '#37474f', // dark grey asphalt
          lines: '#ffffff',
          accent: '#1b5e20',
          bgDetails: ['🌳', '🏢', '🏠']
        };
    }
  };

  // Resize listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const boundedWidth = Math.min(Math.max(width, 350), 750);
        const boundedHeight = Math.min(Math.max(height, 500), 850);
        setDimensions({ width: boundedWidth, height: boundedHeight });
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      keysRef.current[e.code] = true;
      
      // Prevent browser scroll with arrows/space during game
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code) || 
          ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Shoot trigger on F, J keys
      if (e.code === 'KeyF' || e.code === 'KeyJ' || e.key === 'f' || e.key === 'j') {
        shootBullet();
      }
      
      // Initialize audio context dynamically on first pressing standard play controls
      soundManager.startEngine();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update speed stats, curves, and obstacle collisions
  useEffect(() => {
    // Reset stats on mount
    const state = gameStateRef.current;
    state.playerX = 0;
    state.playerTargetX = 0;
    state.speed = 0;
    state.maxSpeed = 8 + vehicle.speed * 0.7;
    state.steeringForce = 0.035 + vehicle.handling * 0.0035;
    state.fuel = 100;
    state.score = 0;
    state.distance = 0;
    state.coins = 0;
    state.isTurbo = false;
    state.turboTime = 0;
    state.isSpun = false;
    state.spinTime = 0;
    state.obstacles = [];
    state.particles = [];
    
    // Reset new mechanisms
    state.lap = 1;
    state.bulletsCount = 5;
    state.bullets = [];
    state.shootCooldown = 0;
    state.isFinished = false;

    // Seed 4 specific Uzbek branded rival race cars
    state.opponents = [
      { id: 'op1', name: 'Alisher (Gentra)', x: -0.6, targetX: -0.6, y: -200, color: '#e53935', accentColor: '#ffeb3b', speed: 4.8, distanceProgress: 3.5, isDead: false, deadTimer: 0 },
      { id: 'op2', name: 'Javohir (Cobalt)', x: 0.6, targetX: 0.6, y: -250, color: '#fdd835', accentColor: '#00e5ff', speed: 4.5, distanceProgress: 2.8, isDead: false, deadTimer: 0 },
      { id: 'op3', name: 'Sardor (Nexia)', x: 0.1, targetX: 0.1, y: -300, color: '#1e88e5', accentColor: '#ff007f', speed: 4.2, distanceProgress: 2.0, isDead: false, deadTimer: 0 },
      { id: 'op4', name: 'Siroj (Matiz)', x: -0.8, targetX: -0.8, y: -350, color: '#43a047', accentColor: '#ffffff', speed: 3.8, distanceProgress: 1.2, isDead: false, deadTimer: 0 },
    ];
  }, [vehicle, trackType]);

  // Main render loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      if (!isPaused) {
        updateGameLogic(dt);
      }
      
      renderGame(ctx);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationId);
      soundManager.stopEngine();
    };
  }, [dimensions, isPaused, trackType, vehicle]);

  // Handle manual interaction buttons (for mobile touch screen)
  const steerLeft = () => {
    const s = gameStateRef.current;
    if (s.isSpun) return;
    s.playerTargetX = Math.max(s.playerTargetX - 0.25, -1.25);
    soundManager.startEngine();
  };

  const steerRight = () => {
    const s = gameStateRef.current;
    if (s.isSpun) return;
    s.playerTargetX = Math.min(s.playerTargetX + 0.25, 1.25);
    soundManager.startEngine();
  };

  // Auxiliary: generate explosion or collection particles
  const createExplosion = (x: number, y: number, color: string, count: number = 15) => {
    const state = gameStateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (state.speed * 0.2), // carry movement inertia slightly
        color,
        size: Math.random() * 5 + 3,
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 30 + 20
      });
    }
  };

  const createExhaustSmoke = (x: number, y: number) => {
    const state = gameStateRef.current;
    const scrollFactor = state.speed * 0.3;
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: Math.random() * 2 + 1 + scrollFactor, // moves backwards relative to car
      color: state.isTurbo ? `hsla(${Math.random() * 360}, 100%, 70%, 0.6)` : 'rgba(180, 180, 180, 0.4)',
      size: Math.random() * 6 + 4,
      alpha: 0.8,
      life: 0,
      maxLife: Math.random() * 20 + 10
    });
  };

  const updateGameLogic = (dt: number) => {
    const state = gameStateRef.current;
    const keys = keysRef.current;

    // 1. Handling Turbo timer
    if (state.isTurbo) {
      state.turboTime -= dt;
      if (state.turboTime <= 0) {
        state.isTurbo = false;
      }
    }

    // 2. Handling Oil Spill Spin timer
    if (state.isSpun) {
      state.spinTime -= dt;
      state.spinAngle += 0.25; // rotation speed during spin
      if (state.spinTime <= 0) {
        state.isSpun = false;
        state.spinAngle = 0;
      }
    }

    // 3. Acceleration & Braking (Controls: Up / Down or W / S or Space)
    const isAccelerating = keys['ArrowUp'] || keys['KeyW'] || keys['Space'];
    const isBraking = keys['ArrowDown'] || keys['KeyS'];

    let targetSpeed = 0;
    if (state.isSpun) {
      targetSpeed = state.speed * 0.92; // lose speed rapidly during spin
    } else if (state.isTurbo) {
      targetSpeed = state.maxSpeed * 1.4; // Mega turbo boost speed
    } else if (isAccelerating) {
      targetSpeed = state.maxSpeed;
    } else if (isBraking) {
      targetSpeed = 1.0; // crawl speed
    } else {
      targetSpeed = state.maxSpeed * 0.45; // idle roll speed
    }

    // Apply off-road speed penalty
    const isOffroad = Math.abs(state.playerX) > 0.95;
    if (isOffroad && !state.isTurbo) {
      targetSpeed = Math.min(targetSpeed, 2.5); // offroad speed limit
      // Spawn grassy/dust particles from tires
      if (state.speed > 0.5 && Math.random() < 0.4) {
        const tireLeftX = (dimensions.width / 2) + state.playerX * (dimensions.width * 0.26) - 15;
        const tireRightX = (dimensions.width / 2) + state.playerX * (dimensions.width * 0.26) + 15;
        const tireY = dimensions.height - 80;
        const pColor = trackType === TrackType.DESERT ? '#ffd54f' : '#33691e';
        createExplosion(tireLeftX, tireY, pColor, 1);
        createExplosion(tireRightX, tireY, pColor, 1);
      }
    }

    // Blend current speed into target speed
    if (state.speed < targetSpeed) {
      state.speed += state.acceleration * (state.isTurbo ? 2.5 : 1.0);
    } else if (state.speed > targetSpeed) {
      state.speed -= state.deceleration * (isBraking ? 2.5 : 1.0);
    }
    
    if (state.speed < 0) state.speed = 0;

    // Send engine sound update
    soundManager.updateEnginePitch(state.speed / (state.maxSpeed * 1.4));

    // 4. Player Steering (Controls: Left / Right or A / D)
    let steerDir = 0;
    if (!state.isSpun) {
      if (keys['ArrowLeft'] || keys['KeyA']) {
        steerDir = -1;
      } else if (keys['ArrowRight'] || keys['KeyD']) {
        steerDir = 1;
      }
      
      // Keyboard smooth target steer adjustment
      if (steerDir !== 0) {
        state.playerTargetX += steerDir * state.steeringForce;
      } else {
        // Return steer target gently towards center if no keys pressed
        state.playerTargetX = state.playerTargetX * 0.96;
      }
      state.playerTargetX = Math.min(Math.max(state.playerTargetX, -1.35), 1.35);

      // Lerp player actual position to target position
      state.playerX += (state.playerTargetX - state.playerX) * 0.2;
    }

    // 5. Fuel system: Fuel decreases over time based on speed and selected car's efficiency
    // Low efficiency (e.g. Turbo Dev stats 3) burns fuel faster.
    const fuelBurnRate = (0.012 + (state.speed * 0.003)) * (11.5 - vehicle.fuelEfficiency) * 0.15;
    if (state.speed > 0 && !state.isTurbo) {
      state.fuel = Math.max(0, state.fuel - fuelBurnRate);
    }
    
    if (state.fuel <= 0) {
      // Trigger game over!
      onGameOver(Math.round(state.score), Math.round(state.distance), state.coins);
      soundManager.stopEngine();
    }

    // 6. Scroll road and increment distance/score
    state.roadOffset += state.speed;
    if (state.speed > 0) {
      state.distance += state.speed * 0.01;
      state.score += (state.speed * 0.1) + (state.isTurbo ? 2.0 : 0.5);
    }

    // 7. Auto road curving effects
    state.curveTimer -= dt;
    if (state.curveTimer <= 0) {
      // Trigger a new turn
      state.nextCurveAngle = (Math.random() - 0.5) * 1.6; // random turn amplitude [-0.8 to 0.8]
      state.curveTimer = Math.random() * 3000 + 3000; // 3 to 6 seconds duration
    }
    // Interpolate curve angle smoothly
    state.curveAngle += (state.nextCurveAngle - state.curveAngle) * 0.02;
    
    // Road curvature draws player backwards depending on speed and curve severity
    if (!state.isSpun && state.speed > 0.5) {
      state.playerTargetX -= state.curveAngle * 0.007 * (state.speed / 5);
    }

    // 8. Obstacles handling (Spawning & updates)
    state.obstacleTimer -= dt;
    if (state.obstacleTimer <= 0 && state.speed > 1.0) {
      spawnObstacle();
    }

    // Update obstacles
    state.obstacles.forEach((obs) => {
      // Obstacle moves downwards relative to player speed
      // Moving cars drive forward, so their relative descent is slower based on speed
      let relativeSpeed = state.speed;
      if (obs.type.startsWith('CAR_')) {
        relativeSpeed = state.speed - obs.speed;
      }
      obs.y += relativeSpeed;

      // Handle collision checking
      const obsPixelY = obs.y;
      const playerPixelY = dimensions.height - 110;

      // Check collision inside vertical window
      if (Math.abs(obsPixelY - playerPixelY) < 45 && !obs.collected) {
        // Check horizontal collision (road width is 0.26 offset)
        const playerPixelX = (dimensions.width / 2) + state.playerX * (dimensions.width * 0.26);
        const obsPixelX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
        
        if (Math.abs(playerPixelX - obsPixelX) < (obs.width + 10)) {
          handleCollision(obs);
        }
      }

      // Add small passive scores for neatly dodging and overtaking obstacles
      if (obs.y > dimensions.height - 100 && !obs.collected && !obs.scoreAwarded && obs.type.startsWith('CAR_')) {
        state.score += 25; // dodge bonus!
        obs.scoreAwarded = true;
      }
    });

    // Keep active obstacles only
    state.obstacles = state.obstacles.filter((obs) => obs.y < dimensions.height + 150 && !obs.collected);

    // A. Decrement shoot cooldown
    if (state.shootCooldown > 0) {
      state.shootCooldown -= dt;
    }

    // B. Update active Bullets physics, check obstacles & opponents hits
    state.bullets.forEach((bullet) => {
      bullet.y -= bullet.speed;

      // Obstacle collision (e.g. cars or road barriers)
      state.obstacles.forEach((obs) => {
        if (!obs.collected && (obs.type.startsWith('CAR_') || obs.type === 'ROAD_BARRIER')) {
          if (Math.abs(bullet.y - obs.y) < 35 && Math.abs(bullet.x - obs.x) < 0.22) {
            obs.collected = true;
            bullet.y = -2000; // deactivate bullet
            state.score += 150;
            soundManager.playCrashSound();
            const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
            createExplosion(pX, obs.y, '#f44336', 15);
          }
        }
      });

      // Opponents collision
      state.opponents.forEach((opp) => {
        if (!opp.isDead) {
          const oppDistDiff = opp.distanceProgress - state.distance;
          if (oppDistDiff > -0.3 && oppDistDiff < 2.5) {
            const oppProgress = 1 - (oppDistDiff / 2.5);
            const horizonY = dimensions.height * 0.35;
            const oppY = horizonY + oppProgress * (dimensions.height - horizonY - 110);
            
            if (Math.abs(bullet.y - oppY) < 35 && Math.abs(bullet.x - opp.x) < 0.22) {
              opp.isDead = true;
              opp.deadTimer = 2000; // spin/stun for 2 seconds
              bullet.y = -2000; // deactivate bullet
              state.score += 250; // extra reward for taking down opponent
              const oppXOnScreen = (dimensions.width / 2) + opp.x * (dimensions.width * 0.26);
              createExplosion(oppXOnScreen, oppY, '#ff3d00', 16);
              soundManager.playCrashSound();
            }
          }
        }
      });
    });
    // Filter active bullets
    state.bullets = state.bullets.filter(b => b.y > -20);

    // C. Update Racing Opponents AI movement
    state.opponents.forEach((opp) => {
      const actualOppSpeed = opp.isDead ? 1.0 : opp.speed;
      opp.distanceProgress += actualOppSpeed * 0.002 * (dt * 0.06);

      if (opp.isDead) {
        opp.deadTimer -= dt;
        if (opp.deadTimer <= 0) {
          opp.isDead = false;
        }
      } else {
        // weaving movement inside lanes
        if (Math.random() < 0.01) {
          opp.targetX = (Math.random() - 0.5) * 1.6;
        }
        opp.x += (opp.targetX - opp.x) * 0.02;
      }
    });

    // D. Compute standings rankings position
    const standings = [
      { id: 'player', name: playerName || 'Poygachi', dist: state.distance },
      ...state.opponents.map(o => ({ id: o.id, name: o.name, dist: o.distanceProgress }))
    ].sort((a, b) => b.dist - a.dist);
    const myIndex = standings.findIndex(item => item.id === 'player');
    state.position = myIndex + 1;

    // E. Lap checkpoints evaluations and victory triggers
    const lapLength = 15; // 15 total distance units per circuit
    const totalLapsCount = 3;
    const targetCheckpoint = state.lap * lapLength;
    if (state.distance >= targetCheckpoint && !state.isFinished) {
      if (state.lap < totalLapsCount) {
        state.lap++;
        soundManager.playGasSound(); // nice notification chime
        createExplosion(dimensions.width / 2, dimensions.height / 2, '#00ffff', 25);
      } else {
        state.isFinished = true;
        state.speed = 1.0; // victory roll
        soundManager.playWinSound(); // champion tune
        setTimeout(() => {
          onVictory(Math.round(state.score), Math.round(state.distance), state.coins);
        }, 2200);
      }
    }

    // 9. Particle Updates
    state.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = 1 - (p.life / p.maxLife);
    });
    state.particles = state.particles.filter((p) => p.life < p.maxLife);

    // Spawn exhaust puffing
    if (state.speed > 0.1 && Math.random() < 0.25) {
      const pX = (dimensions.width / 2) + state.playerX * (dimensions.width * 0.26) - 1.2;
      const pY = dimensions.height - 70;
      createExhaustSmoke(pX + (Math.random() - 0.5) * 6, pY);
    }

    // Trigger HUD metrics refresh
    onStatsChange({
      score: Math.round(state.score),
      distance: Math.round(state.distance),
      coins: state.coins,
      fuel: Math.round(state.fuel),
      speed: Math.round(state.speed * 25), // convert internal step zoom to visual km/h
      isTurbo: state.isTurbo,
      turboTimeRemaining: state.isTurbo ? Math.round(state.turboTime) : 0,
      isSpun: state.isSpun,
      spinTimeRemaining: state.isSpun ? Math.round(state.spinTime) : 0,
      lap: state.lap,
      bulletsCount: state.bulletsCount,
      position: state.position,
      isFinished: state.isFinished
    });
  };

  const spawnObstacle = () => {
    const state = gameStateRef.current;
    state.lastObstacleId++;
    
    // Choose list of lane centers: Left (-0.7), Center (0), Right (0.7)
    const lanes = [-0.68, 0, 0.68];
    const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];

    const obstacleTypes: Obstacle['type'][] = [
      'CAR_RED', 'CAR_YELLOW', 'CAR_BLUE', 
      'OIL_SPILL', 'ROAD_BARRIER', 
      'COIN', 'COIN', 'COIN', // high coin frequency
      'GAS_CANISTER', 'GAS_CANISTER', 
      'STAR_TURBO', // lower star occurrence
      'BULLET_REFILL', 'BULLET_REFILL' // ammo refills
    ];

    const chosenType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];

    let obsSpeed = 0;
    let obsWidth = 24;
    let obsHeight = 45;

    if (chosenType.startsWith('CAR_')) {
      obsSpeed = Math.random() * 2.5 + 2.5; // moves forward with varied speed
      obsWidth = 26;
      obsHeight = 50;
    } else if (chosenType === 'OIL_SPILL') {
      obsWidth = 35;
      obsHeight = 20;
    } else if (chosenType === 'ROAD_BARRIER') {
      obsWidth = 32;
      obsHeight = 25;
    } else if (chosenType === 'BULLET_REFILL') {
      obsWidth = 22;
      obsHeight = 22;
    } else {
      // Gas, Coin, Star collectibles
      obsWidth = 18;
      obsHeight = 18;
    }

    const newObstacle: Obstacle = {
      id: `obs_${state.lastObstacleId}`,
      x: chosenLane + (Math.random() - 0.5) * 0.12, // slight offset inside lane
      y: -80, // off screen top
      type: chosenType,
      speed: obsSpeed,
      width: obsWidth,
      height: obsHeight
    };

    state.obstacles.push(newObstacle);
    // Set next spawn interval (spawns faster when holding high speed)
    const factor = Math.max(0.4, 2.0 - (state.speed * 0.15));
    state.obstacleTimer = (Math.random() * 1000 + 800) * factor;
  };

  const handleCollision = (obs: Obstacle) => {
    const s = gameStateRef.current;
    
    if (obs.type === 'COIN') {
      obs.collected = true;
      s.coins += 1;
      s.score += 50;
      soundManager.playCoinSound();
      
      const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
      createExplosion(pX, obs.y, '#ffd54f', 8);
    } 
    else if (obs.type === 'GAS_CANISTER') {
      obs.collected = true;
      s.fuel = Math.min(100, s.fuel + 25);
      s.score += 10;
      soundManager.playGasSound();

      const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
      createExplosion(pX, obs.y, '#26a69a', 10);
    } 
    else if (obs.type === 'STAR_TURBO') {
      obs.collected = true;
      s.isTurbo = true;
      s.turboTime = 5000; // 5 seconds of fury
      s.score += 100;
      soundManager.playTurboSound();

      const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
      createExplosion(pX, obs.y, '#e040fb', 20);
    } 
    else if (obs.type === 'BULLET_REFILL') {
      obs.collected = true;
      s.bulletsCount = Math.min(30, s.bulletsCount + 5); // gain +5 bullets
      s.score += 75;
      soundManager.playGasSound();

      const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
      createExplosion(pX, obs.y, '#3d5afe', 12); // blue sparks
    } 
    else if (obs.type === 'OIL_SPILL') {
      if (s.isTurbo) return; // Immune!
      if (!s.isSpun) {
        s.isSpun = true;
        s.spinTime = 800; // spin for 800 ms
        s.spinAngle = 0;
        soundManager.playSpinSound();
        const pX = (dimensions.width / 2) + s.playerX * (dimensions.width * 0.26);
        createExplosion(pX, dimensions.height - 110, '#37474f', 12);
      }
    } 
    else {
      // Barrier or Other car collision
      if (s.isTurbo) {
        // Destroy the obstacle satisfyingly!
        obs.collected = true;
        s.score += 150;
        soundManager.playCrashSound();
        const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
        createExplosion(pX, obs.y, '#f44336', 22);
        return;
      }

      // regular crash
      obs.collected = true; // remove crashed car
      s.speed = 0.5; // sudden stop
      s.fuel = Math.max(0, s.fuel - 18); // Lose substantial gas as hitpoints!
      
      const pX = (dimensions.width / 2) + obs.x * (dimensions.width * 0.26);
      createExplosion(pX, obs.y, '#e53935', 25);
      
      soundManager.playCrashSound();
    }
  };

  // HTML5 Drawing logic
  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const state = gameStateRef.current;
    const p = getThemePalette();
    const w = dimensions.width;
    const h = dimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Draw SKY
    ctx.fillStyle = p.sky;
    ctx.fillRect(0, 0, w, h * 0.35);

    // Track decorations (e.g. Neon grid sun, Desert sand pyramids, City clouds)
    if (trackType === TrackType.NEON_NIGHT) {
      // Huge neon sun
      const sunGradient = ctx.createLinearGradient(0, h * 0.05, 0, h * 0.35);
      sunGradient.addColorStop(0, '#ff007f');
      sunGradient.addColorStop(0.5, '#7b00cc');
      sunGradient.addColorStop(1, '#0e001f');
      
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.35, 75, Math.PI, 2 * Math.PI);
      ctx.fill();

      // Lines inside retro sun
      ctx.strokeStyle = '#0e001f';
      ctx.lineWidth = 4;
      for (let sy = h * 0.27; sy < h * 0.35; sy += 8) {
        ctx.beginPath();
        ctx.moveTo((w / 2) - 80, sy);
        ctx.lineTo((w / 2) + 80, sy);
        ctx.stroke();
      }
    } 
    else if (trackType === TrackType.DESERT) {
      // Cacti/Hills background
      ctx.fillStyle = '#b26a00';
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.35);
      ctx.lineTo(w * 0.25, h * 0.22);
      ctx.lineTo(w * 0.4, h * 0.35);
      
      ctx.moveTo(w * 0.55, h * 0.35);
      ctx.lineTo(w * 0.75, h * 0.18);
      ctx.lineTo(w * 0.95, h * 0.35);
      ctx.fill();
    } 
    else {
      // City clouds and small mountains
      ctx.fillStyle = '#b3e5fc';
      ctx.beginPath();
      ctx.arc(w * 0.2, h * 0.18, 30, 0, Math.PI * 2);
      ctx.arc(w * 0.26, h * 0.16, 40, 0, Math.PI * 2);
      ctx.arc(w * 0.32, h * 0.18, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w * 0.7, h * 0.14, 25, 0, Math.PI * 2);
      ctx.arc(w * 0.75, h * 0.12, 35, 0, Math.PI * 2);
      ctx.arc(w * 0.8, h * 0.14, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Draw DIRT / LAND shoulder
    ctx.fillStyle = p.dirt;
    ctx.fillRect(0, h * 0.35, w, h * 0.65);

    // 3. Draw winding ROAD using polygon projection
    const horizonY = h * 0.35;
    const roadBottomWidth = w * 0.65;
    const roadTopWidth = w * 0.08;

    const roadCenterBottom = w / 2;
    // Apply winding turning factor to top of the road to make curves pop!
    const roadCenterTop = (w / 2) + state.curveAngle * 125;

    // Draw main black asphalt road shape
    ctx.fillStyle = p.road;
    ctx.beginPath();
    ctx.moveTo(roadCenterBottom - roadBottomWidth / 2, h);
    ctx.lineTo(roadCenterTop - roadTopWidth / 2, horizonY);
    ctx.lineTo(roadCenterTop + roadTopWidth / 2, horizonY);
    ctx.lineTo(roadCenterBottom + roadBottomWidth / 2, h);
    ctx.closePath();
    ctx.fill();

    // Road side curbs (red/white striped edges for visual speed)
    const curbSteps = 15;
    const roadSegmentH = (h * 0.65) / curbSteps;

    for (let i = 0; i < curbSteps; i++) {
      const stepY1 = h - i * roadSegmentH;
      const stepY2 = h - (i + 1) * roadSegmentH;

      // Project widths
      const progress1 = i / curbSteps;
      const progress2 = (i + 1) / curbSteps;

      const rw1 = roadBottomWidth * (1 - progress1) + roadTopWidth * progress1;
      const rw2 = roadBottomWidth * (1 - progress2) + roadTopWidth * progress2;

      const rx1 = roadCenterBottom * (1 - progress1) + roadCenterTop * progress1;
      const rx2 = roadCenterBottom * (1 - progress2) + roadCenterTop * progress2;

      // Toggle red/white stripes based on roadOffset
      const stripePhase = Math.floor((state.roadOffset * 0.08) + (curbSteps - i)) % 2 === 0;
      ctx.fillStyle = stripePhase ? '#f44336' : '#ffffff';

      // Neon track uses glowing magenta vs cyan edges!
      if (trackType === TrackType.NEON_NIGHT) {
        ctx.fillStyle = stripePhase ? '#ff007f' : '#00ffff';
      }

      const curbW1 = 15 * (1 - progress1) + 2 * progress1;
      const curbW2 = 15 * (1 - progress2) + 2 * progress2;

      // Left Curb
      ctx.beginPath();
      ctx.moveTo(rx1 - rw1 / 2, stepY1);
      ctx.lineTo(rx1 - rw1 / 2 - curbW1, stepY1);
      ctx.lineTo(rx2 - rw2 / 2 - curbW2, stepY2);
      ctx.lineTo(rx2 - rw2 / 2, stepY2);
      ctx.closePath();
      ctx.fill();

      // Right Curb
      ctx.beginPath();
      ctx.moveTo(rx1 + rw1 / 2, stepY1);
      ctx.lineTo(rx1 + rw1 / 2 + curbW1, stepY1);
      ctx.lineTo(rx2 + rw2 / 2 + curbW2, stepY2);
      ctx.lineTo(rx2 + rw2 / 2, stepY2);
      ctx.closePath();
      ctx.fill();

      // Center dotted lanes
      if (i % 2 === 0 && i > 0) {
        const laneOffsetPhase = Math.floor(state.roadOffset * 0.08) % 2;
        ctx.strokeStyle = p.lines;
        ctx.lineWidth = 4 * (1 - progress1) + 0.5 * progress1;
        ctx.setLineDash([]);
        
        ctx.beginPath();
        ctx.moveTo(rx1, stepY1);
        ctx.lineTo(rx2, stepY2);
        ctx.stroke();
      }
    }

    // 4. Draw dynamic roadside items (Trees, Buildings or Cacti popping on horizon)
    const totalSideItems = 6;
    for (let k = 0; k < totalSideItems; k++) {
      // stagger positions
      const progress = ((state.roadOffset * 0.003 + k / totalSideItems) % 1.0);
      const iy = horizonY + progress * (h * 0.65);
      
      // project side offset
      const curW = roadBottomWidth * (1 - progress) + roadTopWidth * progress;
      const curX = roadCenterBottom * (1 - progress) + roadCenterTop * progress;
      
      const stretchOffset = 45 + progress * 160;

      // Draw left decorative item
      const leftDetailsX = curX - curW / 2 - stretchOffset;
      const size = 15 + progress * 55;
      
      ctx.font = `${size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const decorationIndex = (k + (trackType === TrackType.NEON_NIGHT ? 1 : 2)) % p.bgDetails.length;
      const itemEmoji = p.bgDetails[decorationIndex];
      
      // Only draw if inside visible region
      if (iy > horizonY + 10 && iy < h + 20) {
        ctx.fillText(itemEmoji, leftDetailsX, iy);
        ctx.fillText(itemEmoji, curX + curW / 2 + stretchOffset, iy);
      }
    }

    // 5. Draw Obstacles (cars, coins, gas)
    state.obstacles.forEach((obs) => {
      // Obtain projected screen scale for obstacle
      // obs.y represents vertical position, relative to player
      const relativeY = obs.y;
      
      // Compute lane horizontal position
      const lanePixelWidth = w * 0.26;
      const screenX = (w / 2) + obs.x * lanePixelWidth;
      
      // Draw actual obstacle relative to state
      if (obs.type === 'COIN') {
        // Collectible Coin spinning gold medal
        const pulse = Math.abs(Math.sin(performance.now() * 0.01)) * 3;
        const radialGrad = ctx.createRadialGradient(screenX, relativeY, 2, screenX, relativeY, obs.width / 2 + pulse);
        radialGrad.addColorStop(0, '#fff3a3');
        radialGrad.addColorStop(0.3, '#ffd54f');
        radialGrad.addColorStop(0.8, '#ff8f00');
        radialGrad.addColorStop(1, '#ff6f00');

        ctx.fillStyle = radialGrad;
        ctx.beginPath();
        ctx.arc(screenX, relativeY, obs.width / 2 + pulse / 2, 0, Math.PI * 2);
        ctx.fill();

        // draw border and inner dollar/tanga mark
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('$', screenX, relativeY + 3.5);
      } 
      else if (obs.type === 'GAS_CANISTER') {
        // Petrol gas canister
        ctx.fillStyle = '#f44336'; // Red canister body
        ctx.fillRect(screenX - 8, relativeY - 10, 16, 18);
        
        ctx.fillStyle = '#ffffff'; // white stripe
        ctx.fillRect(screenX - 8, relativeY - 4, 16, 4);

        // tiny nozzle/cap
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(screenX + 2, relativeY - 14, 4, 4);

        // letters
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText('BENZ', screenX, relativeY + 1);
      } 
      else if (obs.type === 'STAR_TURBO') {
        const rotationVal = (performance.now() * 0.007);
        ctx.save();
        ctx.translate(screenX, relativeY);
        ctx.rotate(rotationVal);
        
        // Shiny star
        ctx.fillStyle = '#ea80fc';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          ctx.lineTo(Math.cos((18 + s * 72) * Math.PI / 180) * 11, -Math.sin((18 + s * 72) * Math.PI / 180) * 11);
          ctx.lineTo(Math.cos((54 + s * 72) * Math.PI / 180) * 5.5, -Math.sin((54 + s * 72) * Math.PI / 180) * 5.5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      } 
      else if (obs.type === 'OIL_SPILL') {
        // Slippery oil puddle
        ctx.fillStyle = 'rgba(26, 26, 36, 0.75)';
        ctx.beginPath();
        ctx.ellipse(screenX, relativeY, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // oily shine edge
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(screenX, relativeY, obs.width / 2 - 2, obs.height / 2 - 2, -0.4, 0.4, Math.PI);
        ctx.stroke();
      } 
      else if (obs.type === 'ROAD_BARRIER') {
        // Yellow-black striped roadblock barrier bar
        ctx.fillStyle = '#ffb300';
        ctx.fillRect(screenX - obs.width / 2, relativeY - 6, obs.width, 12);
        
        ctx.fillStyle = '#212121';
        for (let bx = -obs.width / 2 + 3; bx < obs.width / 2; bx += 10) {
          ctx.beginPath();
          ctx.moveTo(screenX + bx, relativeY - 6);
          ctx.lineTo(screenX + bx + 5, relativeY + 6);
          ctx.lineTo(screenX + bx + 2, relativeY + 6);
          ctx.lineTo(screenX + bx - 3, relativeY - 6);
          ctx.closePath();
          ctx.fill();
        }

        // legs of barrier
        ctx.fillStyle = '#757575';
        ctx.fillRect(screenX - obs.width / 2 + 2, relativeY + 6, 4, 8);
        ctx.fillRect(screenX + obs.width / 2 - 6, relativeY + 6, 4, 8);
      } 
      else if (obs.type === 'BULLET_REFILL') {
        // Draw bullet magazine ammo box
        ctx.fillStyle = '#1a237e'; // dark blue military metal
        ctx.fillRect(screenX - 10, relativeY - 10, 20, 20);
        ctx.strokeStyle = '#29b6f6';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(screenX - 10, relativeY - 10, 20, 20);

        // Ammo clip bullets inside
        ctx.fillStyle = '#ffd54f'; // shiny gold
        ctx.fillRect(screenX - 5, relativeY - 5, 2.5, 10);
        ctx.fillRect(screenX - 1.2, relativeY - 5, 2.5, 10);
        ctx.fillRect(screenX + 2.5, relativeY - 5, 2.5, 10);
      }
      else {
        // Other NPC cars
        let npcColor = '#f44336';
        if (obs.type === 'CAR_YELLOW') npcColor = '#ffc107';
        if (obs.type === 'CAR_BLUE') npcColor = '#2196f3';

        drawProceduralCar(ctx, screenX, relativeY, npcColor, '#ffffff', false, 0);
      }
    });

    // 5.5 Draw racing opponents
    state.opponents.forEach((opp) => {
      const oppDistLeft = opp.distanceProgress - state.distance;
      // draw if in viewport range
      if (oppDistLeft > -0.5 && oppDistLeft < 2.5) {
        const oppProgress = 1 - (oppDistLeft / 2.5); // 0 (horizon) to 1 (near car)
        const oppY = horizonY + oppProgress * (h - horizonY - 110);
        const oppX = (w / 2) + opp.x * (w * 0.26) * oppProgress;

        // project size
        const oppScale = 0.35 + oppProgress * 0.65;

        ctx.save();
        ctx.translate(oppX, oppY);
        ctx.scale(oppScale, oppScale);
        
        // Draw standard car (since Opponent has color / accentColor)
        drawProceduralCar(
          ctx, 
          0, 
          0, 
          opp.color, 
          opp.accentColor, 
          false, 
          opp.isDead ? Math.sin(performance.now() * 0.05) * 0.4 : 0
        );

        ctx.restore();

        // Draw beautiful name tags above them!
        ctx.fillStyle = '#ffffff';
         ctx.shadowColor = '#000000';
         ctx.shadowBlur = 4;
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        // Add "(STUNNED!)" if they are dead
        const tag = opp.isDead ? `💥 ${opp.name}` : opp.name;
        ctx.fillText(tag, oppX, oppY - 26 * oppScale);
        ctx.shadowBlur = 0;
      }
    });

    // 5.6 Draw active bullets
    state.bullets.forEach((bullet) => {
      const bLaneWidth = w * 0.26;
      const bulletX = (w / 2) + bullet.x * bLaneWidth;
      const bulletY = bullet.y;

      // glowing plasma laser beams!
      ctx.save();
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(bulletX - 2, bulletY - 12, 4, 12);

      ctx.fillStyle = '#ffffff'; // hot white center core
      ctx.fillRect(bulletX - 1, bulletY - 10, 2, 10);
      ctx.restore();
    });

    // 5.7 Draw Checkered FINISH LINE (marra chizig'i)
    const lapDist = 15;
    const nextFinishTarget = state.lap * lapDist;
    const finishDistDifference = nextFinishTarget - state.distance;
    if (finishDistDifference > 0 && finishDistDifference < 2.0) {
      const finishProgress = 1 - (finishDistDifference / 2.0); // 0 (horizon) to 1 (near car)
      const fY = horizonY + finishProgress * (h - horizonY - 110);
      
      // width and center projection
      const fW = roadBottomWidth * finishProgress + roadTopWidth * (1 - finishProgress);
      const fX = roadCenterBottom * finishProgress + roadCenterTop * (1 - finishProgress);

      // Checkered grid
      const checksCount = 12;
      const checkW = fW / checksCount;
      const checkH = 8 + finishProgress * 15;

      ctx.save();
      // Outer support poles
      ctx.fillStyle = '#f44336'; // vivid red poles
      ctx.fillRect(fX - fW / 2 - 8, fY - checkH * 1.5, 6, checkH * 3);
      ctx.fillRect(fX + fW / 2 + 2, fY - checkH * 1.5, 6, checkH * 3);
      
      // draw cross checkered bar
      for (let r = 0; r < 2; r++) { // 2 rows of checkered tiles
        const ry = fY - checkH / 2 + (r * (checkH / 2));
        for (let c = 0; c < checksCount; c++) {
          const isWhite = (c + r + Math.floor(state.roadOffset * 0.02)) % 2 === 0;
          ctx.fillStyle = isWhite ? '#ffffff' : '#000000';
          ctx.fillRect(fX - fW / 2 + c * checkW, ry, checkW + 1, checkH / 2);
        }
      }

      // Render lap label!
      ctx.fillStyle = '#ffd54f';
       ctx.shadowColor = '#000000';
       ctx.shadowBlur = 5;
      ctx.font = `bold ${11 + finishProgress * 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`MARRA / LAP ${state.lap}`, fX, fY - checkH - 8);
      ctx.restore();
    }

    // 6. Draw PARTICLES
    state.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. Draw PLAYER VEHICLE
    const playerXOnScreen = (w / 2) + state.playerX * (w * 0.26);
    const playerYOnScreen = h - 110;

    let isSpeedingBrakes = keysRef.current['ArrowDown'] || keysRef.current['KeyS'];

    // If turbo, draw visual trailing shadows
    if (state.isTurbo) {
      for (let shadow = 1; shadow <= 3; shadow++) {
        const shadowY = playerYOnScreen + (shadow * 15);
        const shadowOpacity = 0.5 - (shadow * 0.15);
        ctx.save();
        ctx.globalAlpha = shadowOpacity;
        drawProceduralCar(
          ctx, 
          playerXOnScreen + (shadow * -state.curveAngle * 10), 
          shadowY, 
          `hsla(${(performance.now() * 0.2 + shadow * 60) % 360}, 100%, 65%, 1)`, 
          vehicle.accentColor, 
          false, 
          0
        );
        ctx.restore();
      }
    }

    // steering angle variables
    let turnSteerRotation = 0;
    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) turnSteerRotation = -0.15;
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) turnSteerRotation = 0.15;

    // Draw main client car
    drawProceduralCar(
      ctx, 
      playerXOnScreen, 
      playerYOnScreen, 
      vehicle.color, 
      vehicle.accentColor, 
      isSpeedingBrakes, 
      state.isSpun ? state.spinAngle : turnSteerRotation,
      state.isTurbo // flashing glowing rainbow lines if turbo active
    );
  };

  // Helper routine to draw procedural vehicle with fine vector shapes
  const drawProceduralCar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    primaryColor: string,
    accentColor: string,
    isBraking: boolean,
    steerRotation: number = 0,
    isSuperRainbow: boolean = false
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(steerRotation);

    // Apply glowing shadow or neon aura if Turbo active
    if (isSuperRainbow) {
      ctx.shadowColor = `hsla(${(performance.now() * 0.5) % 360}, 100%, 70%, 1)`;
      ctx.shadowBlur = 15;
    }

    // 1. Black tires
    ctx.fillStyle = '#212121';
    // Back left and back right tires (fixed straight)
    ctx.fillRect(-17, 10, 5, 12);
    ctx.fillRect(12, 10, 5, 12);

    // Front tires (rotateable!)
    ctx.save();
    ctx.translate(-17, -15);
    ctx.rotate(steerRotation * 1.5);
    ctx.fillRect(0, -6, 5, 12);
    ctx.restore();

    ctx.save();
    ctx.translate(12, -15);
    ctx.rotate(steerRotation * 1.5);
    ctx.fillRect(0, -6, 5, 12);
    ctx.restore();

    // 2. Chassis body contours
    ctx.fillStyle = primaryColor;
    if (isSuperRainbow) {
      ctx.fillStyle = `hsla(${(performance.now() * 0.3) % 360}, 100%, 50%, 1)`;
    }
    
    // Draw rounded outer bounds of car cabin
    ctx.beginPath();
    ctx.moveTo(-14, -22); // nose left
    ctx.bezierCurveTo(-14, -26, 14, -26, 14, -22); // nose rounded front
    ctx.lineTo(14, 18); // rear right
    ctx.bezierCurveTo(12, 23, -12, 23, -14, 18); // bumper curved rear
    ctx.closePath();
    ctx.fill();

    // Draw side mirrors
    ctx.fillStyle = primaryColor;
    ctx.fillRect(-17, -15, 3, 4);
    ctx.fillRect(14, -15, 3, 4);

    // 3. Racing Stripes or custom decoration overlay
    ctx.fillStyle = accentColor;
    ctx.fillRect(-6, -21, 3, 38);
    ctx.fillRect(3, -21, 3, 38);

    // 4. Windshield & glass window cabin (blue tint retro style)
    ctx.fillStyle = '#b3e5fc';
    ctx.beginPath();
    ctx.moveTo(-9, -12); // windshield front
    ctx.lineTo(9, -12);
    ctx.lineTo(11, 4);   // rear window back
    ctx.lineTo(-11, 4);
    ctx.closePath();
    ctx.fill();

    // Side pillars (color blocking to make windows look real)
    ctx.fillStyle = '#102027';
    ctx.fillRect(-11, -12, 2, 16);
    ctx.fillRect(9, -12, 2, 16);
    ctx.fillRect(-10, -5, 20, 2); // cabin crossbars

    // 5. Headlights and glowing beams
    ctx.fillStyle = '#fff9c4'; // yellow glow
    ctx.fillRect(-12, -24, 4, 3);
    ctx.fillRect(8, -24, 4, 3);

    // Brake / Taillights
    ctx.fillStyle = isBraking ? '#ff1744' : '#b71c1c'; // Bright red if braking
    ctx.fillRect(-12, 20, 5, 3);
    ctx.fillRect(7, 20, 5, 3);

    // Draw little spoiler wings for sporting speed models
    if (primaryColor === '#111111' || primaryColor === '#ffffff') {
      ctx.fillStyle = accentColor;
      ctx.fillRect(-16, 17, 32, 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-17, 15, 2, 8);
      ctx.fillRect(15, 15, 2, 8);
    }

    ctx.restore();
  };

  return (
    <div id="game-container-wrapper" className="relative w-full h-full flex flex-col items-center justify-center">
      {/* Absolute container fitting frame sizing */}
      <div 
        ref={containerRef} 
        id="game-canvas-container" 
        className="w-full max-w-2xl bg-[#121214] border border-gray-800 rounded-2xl overflow-hidden flex items-center justify-center shadow-2xl relative"
        style={{ aspectRatio: '4/5' }}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          id="retro-game-canvas"
          onClick={shootBullet}
          className="w-full h-full cursor-crosshair select-none touch-none"
        />

        {/* Dynamic touch overlay buttons for mobile playing */}
        <div 
          id="mobile-touch-steering-zones" 
          className="absolute inset-0 pointer-events-none md:hidden flex justify-between z-10"
        >
          {/* Steer Left Trigger Panel */}
          <button
            id="touch-left-steer-pad"
            onClick={steerLeft}
            className="w-1/3 h-full cursor-pointer pointer-events-auto active:bg-white/5 transition-colors duration-150 relative"
            title="Steer Left"
          >
            <div className="absolute bottom-6 left-6 w-16 h-16 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 text-white text-xl font-bold select-none">
              ◀
            </div>
          </button>

          {/* Neutral acceleration help panel */}
          <div className="w-1/3 h-full" />

          {/* Steer Right Trigger Panel */}
          <button
            id="touch-right-steer-pad"
            onClick={steerRight}
            className="w-1/3 h-full cursor-pointer pointer-events-auto active:bg-white/5 transition-colors duration-150 relative"
            title="Steer Right"
          >
            <div className="absolute bottom-6 right-6 w-16 h-16 rounded-full bg-black/40 border border-white/20 backdrop-blur-md flex items-center justify-center active:scale-95 text-white text-xl font-bold select-none">
              ▶
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
