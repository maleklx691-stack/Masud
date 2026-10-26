import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Eye, Zap, Flame } from 'lucide-react';
import aviatorLogo from '../assets/images/aviator_game_logo_1793032284829.jpg';

interface AviatorCanvasProps {
  multiplier: number;
  status: 'waiting' | 'flying' | 'crashed';
  waitingSeconds: number;
  finalCrashMult: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  width: number;
}

export const AviatorCanvas: React.FC<AviatorCanvasProps> = ({
  multiplier,
  status,
  waitingSeconds,
  finalCrashMult,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // 8K Ultra HD Engine active state
  const [qualityMode, setQualityMode] = useState<'8K' | '4K'>('8K');

  // Sync props to refs to decouple 60/120fps render loop from React state re-renderings
  const multiplierRef = useRef<number>(multiplier);
  const statusRef = useRef<'waiting' | 'flying' | 'crashed'>(status);
  const waitingSecondsRef = useRef<number>(waitingSeconds);
  const finalCrashMultRef = useRef<number>(finalCrashMult);

  useEffect(() => {
    multiplierRef.current = multiplier;
    statusRef.current = status;
    waitingSecondsRef.current = waitingSeconds;
    finalCrashMultRef.current = finalCrashMult;
  }, [multiplier, status, waitingSeconds, finalCrashMult]);

  // Animation state persistent refs
  const displayMultRef = useRef<number>(1.0);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<Star[]>([]);
  const speedLinesRef = useRef<SpeedLine[]>([]);
  const radarAngleRef = useRef<number>(0);
  const propellerAngleRef = useRef<number>(0);
  const shockwaveRef = useRef<{ radius: number; alpha: number; active: boolean }>({
    radius: 0,
    alpha: 0,
    active: false,
  });

  // Crash "Flew Away" zoom-off animation state
  const flewAwayRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    alpha: number;
  }>({
    active: false,
    x: 0,
    y: 0,
    vx: 15,
    vy: -9,
    rotation: -0.35,
    alpha: 1.0,
  });

  const lastCrashMultRef = useRef<number>(0);

  // Initialize 8K Starfield
  useEffect(() => {
    const stars: Star[] = [];
    const starColors = ['#ffffff', '#fecdd3', '#e0f2fe', '#fef08a', '#fed7aa'];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.65 + 0.25,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      // 8K Super-sampling multiplier: Up to 3.5x native display resolution
      const dpr = Math.max(2, Math.min(window.devicePixelRatio || 1, 3.5));
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);

      // High-precision subpixel antialiasing & high-fidelity smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let lastTime = performance.now();

    // 60FPS / 120FPS continuous 8K render loop
    const render = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      if (width === 0 || height === 0) {
        animFrameId.current = requestAnimationFrame(render);
        return;
      }

      // Smooth visual multiplier interpolation (no jitter or discrete stepping)
      const currentStatus = statusRef.current;
      const targetMult = multiplierRef.current;

      if (currentStatus === 'waiting') {
        displayMultRef.current = 1.0;
        flewAwayRef.current.active = false;
        shockwaveRef.current.active = false;
      } else if (currentStatus === 'flying') {
        flewAwayRef.current.active = false;
        shockwaveRef.current.active = false;
        // Silky smooth interpolation
        displayMultRef.current += (targetMult - displayMultRef.current) * 0.35;
      } else if (currentStatus === 'crashed') {
        displayMultRef.current = targetMult;
      }

      // Propeller spin velocity proportional to altitude/speed
      const multBoost = Math.min(3, 1 + (displayMultRef.current - 1) * 0.08);
      propellerAngleRef.current += 0.65 * multBoost;

      // 1. Render Deep Space 8K Nebula, Stars & Grid
      draw8KBackground(ctx, width, height, now, currentStatus);

      // 2. State-specific drawing
      if (currentStatus === 'waiting') {
        drawWaitingState(ctx, width, height, waitingSecondsRef.current);
      } else {
        drawFlightScene(ctx, width, height, displayMultRef.current, currentStatus, now);
      }

      // 3. Render Shockwave effect if active
      if (shockwaveRef.current.active && shockwaveRef.current.alpha > 0.01) {
        drawShockwave(ctx, width, height);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
    };
  }, []);

  // 8K Ultra-HD Deep Space & Nebula Background
  const draw8KBackground = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    now: number,
    currentStatus: 'waiting' | 'flying' | 'crashed'
  ) => {
    // 1. Deep Cosmic Nebula Gradient
    const bgGrad = ctx.createRadialGradient(0, h, 30, w * 0.45, h * 0.5, Math.max(w, h) * 1.1);
    bgGrad.addColorStop(0, 'rgba(244, 63, 94, 0.18)'); // Rose nebular glow
    bgGrad.addColorStop(0.35, 'rgba(30, 10, 24, 0.7)'); // Deep crimson space
    bgGrad.addColorStop(0.7, 'rgba(10, 14, 26, 0.95)'); // Midnight slate
    bgGrad.addColorStop(1, '#05070d'); // Void black
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. 8K Twinkling Starfield
    const stars = starsRef.current;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.twinklePhase += s.twinkleSpeed;
      const alpha = Math.max(0.1, s.baseAlpha + Math.sin(s.twinklePhase) * 0.35);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.size > 1.4 ? 6 : 2;

      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 8K High-Tech Precision Grid with Micro-crosses
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    const gridSpacing = 42;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Grid intersection precision dots
    ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
    for (let x = gridSpacing; x < w; x += gridSpacing * 2) {
      for (let y = gridSpacing; y < h; y += gridSpacing * 2) {
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    // 4. Sweeping Dual-Beam 8K Hologram Radar
    radarAngleRef.current += 0.009;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(radarAngleRef.current);

    // Primary beam
    const beamGrad = ctx.createLinearGradient(0, 0, Math.max(w, h) * 0.75, 0);
    beamGrad.addColorStop(0, 'rgba(244, 63, 94, 0.14)');
    beamGrad.addColorStop(0.6, 'rgba(244, 63, 94, 0.03)');
    beamGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, Math.max(w, h) * 0.75, 0, Math.PI / 5);
    ctx.closePath();
    ctx.fill();

    // High-resolution leading laser edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.max(w, h) * 0.75, 0);
    ctx.stroke();

    ctx.restore();

    // 5. High-Speed Warp Streak Lines in Flight Mode
    if (currentStatus === 'flying') {
      // Spawn speed lines
      if (Math.random() < 0.45) {
        speedLinesRef.current.push({
          x: w + 20,
          y: Math.random() * h,
          length: Math.random() * 55 + 25,
          speed: Math.random() * 7 + 8,
          alpha: Math.random() * 0.35 + 0.15,
          width: Math.random() * 1.5 + 0.6,
        });
      }

      // Render speed lines
      ctx.save();
      for (let i = speedLinesRef.current.length - 1; i >= 0; i--) {
        const sl = speedLinesRef.current[i];
        sl.x -= sl.speed;

        if (sl.x + sl.length < 0) {
          speedLinesRef.current.splice(i, 1);
          continue;
        }

        const lineGrad = ctx.createLinearGradient(sl.x, sl.y, sl.x + sl.length, sl.y);
        lineGrad.addColorStop(0, `rgba(244, 63, 94, ${sl.alpha})`);
        lineGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = sl.width;
        ctx.beginPath();
        ctx.moveTo(sl.x, sl.y);
        ctx.lineTo(sl.x + sl.length, sl.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // Waiting countdown circle
  const drawWaitingState = (ctx: CanvasRenderingContext2D, w: number, h: number, seconds: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.2;

    const totalDuration = 5;
    const progress = Math.max(0, Math.min(1, (totalDuration - seconds) / totalDuration));

    ctx.save();
    // 8K Outer Glass Halo
    const halo = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.3);
    halo.addColorStop(0, 'rgba(244, 63, 94, 0.15)');
    halo.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Background track ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Glowing Neon Crimson progress ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineCap = 'round';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.stroke();

    ctx.restore();
  };

  // Dynamic natural flight physics & curve calculation
  const getFlightCoordinates = (w: number, h: number, mult: number, now: number) => {
    const startX = 35;
    const startY = h - 35;

    const norm = Math.max(0, mult - 1.0);
    const progress = 1 - Math.exp(-0.35 * Math.pow(norm, 0.75));

    const maxX = w - 110;
    const maxY = 65;
    const currentX = startX + (maxX - startX) * Math.min(progress, 0.94);
    const currentY = startY - (startY - maxY) * Math.pow(Math.min(progress, 0.94), 0.82);

    const time = now * 0.001;
    const floatOffset = progress > 0.05 ? Math.sin(time * 3.2) * 5 + Math.cos(time * 2.1) * 3 : 0;
    const finalX = currentX;
    const finalY = currentY + floatOffset;

    const cpX = startX + (currentX - startX) * 0.52;
    const cpY = startY;

    const dtProgress = 0.01;
    const nextNorm = norm + dtProgress;
    const nextProgress = 1 - Math.exp(-0.35 * Math.pow(nextNorm, 0.75));
    const nextX = startX + (maxX - startX) * Math.min(nextProgress, 0.94);
    const nextY = startY - (startY - maxY) * Math.pow(Math.min(nextProgress, 0.94), 0.82);

    const baseAngle = Math.atan2(nextY - currentY, nextX - currentX);
    const dynamicAngle = baseAngle + (progress > 0.05 ? Math.sin(time * 3.5) * 0.04 : 0);

    return {
      startX,
      startY,
      currentX: finalX,
      currentY: finalY,
      cpX,
      cpY,
      angle: dynamicAngle,
      progress,
    };
  };

  // Shockwave ring on crash
  const drawShockwave = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const sw = shockwaveRef.current;
    sw.radius += 8;
    sw.alpha = Math.max(0, sw.alpha - 0.03);

    ctx.save();
    ctx.beginPath();
    ctx.arc(flewAwayRef.current.x, flewAwayRef.current.y, sw.radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(244, 63, 94, ${sw.alpha})`;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.restore();
  };

  // Main flight scene renderer
  const drawFlightScene = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    mult: number,
    gameStatus: 'flying' | 'crashed',
    now: number
  ) => {
    const coords = getFlightCoordinates(w, h, mult, now);

    // Handle crash "Flew Away" trigger
    if (gameStatus === 'crashed') {
      if (!flewAwayRef.current.active) {
        flewAwayRef.current = {
          active: true,
          x: coords.currentX,
          y: coords.currentY,
          vx: 15,
          vy: -9,
          rotation: coords.angle - 0.2,
          alpha: 1.0,
        };
        shockwaveRef.current = {
          radius: 10,
          alpha: 0.9,
          active: true,
        };
        lastCrashMultRef.current = mult;
      }
    }

    // 1. Draw glowing 8K flight curve & volumetric gradient
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coords.startX, coords.startY);
    ctx.quadraticCurveTo(coords.cpX, coords.cpY, coords.currentX, coords.currentY);
    ctx.lineTo(coords.currentX, coords.startY);
    ctx.lineTo(coords.startX, coords.startY);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, coords.currentY, 0, coords.startY);
    fillGrad.addColorStop(0, gameStatus === 'crashed' ? 'rgba(239, 68, 68, 0.32)' : 'rgba(244, 63, 94, 0.42)');
    fillGrad.addColorStop(0.5, 'rgba(225, 29, 72, 0.12)');
    fillGrad.addColorStop(1, 'rgba(225, 29, 72, 0.0)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Layer 1: Ambient Neon Bloom
    ctx.beginPath();
    ctx.moveTo(coords.startX, coords.startY);
    ctx.quadraticCurveTo(coords.cpX, coords.cpY, coords.currentX, coords.currentY);
    ctx.lineWidth = 8;
    ctx.strokeStyle = gameStatus === 'crashed' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(244, 63, 94, 0.55)';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 24;
    ctx.stroke();

    // Layer 2: Ultra-crisp razor core laser stroke
    ctx.beginPath();
    ctx.moveTo(coords.startX, coords.startY);
    ctx.quadraticCurveTo(coords.cpX, coords.cpY, coords.currentX, coords.currentY);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = gameStatus === 'crashed' ? '#f87171' : '#ffffff';
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // High-precision Glowing tip dot with micro-pulsing aura
    ctx.save();
    ctx.beginPath();
    ctx.arc(coords.currentX, coords.currentY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(coords.currentX, coords.currentY, 9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 2. High-Fidelity 8K Engine Exhaust Particles & Embers
    if (gameStatus === 'flying') {
      for (let i = 0; i < 4; i++) {
        particlesRef.current.push({
          x: coords.currentX - 22 + (Math.random() * 4 - 2),
          y: coords.currentY + 12 + (Math.random() * 4 - 2),
          vx: -(Math.random() * 4.2 + 2.5),
          vy: Math.random() * 1.8 - 0.5,
          size: Math.random() * 6 + 3,
          alpha: 0.9,
          decay: Math.random() * 0.035 + 0.025,
          color: Math.random() > 0.4 ? '#fb7185' : Math.random() > 0.5 ? '#f59e0b' : '#ffffff',
        });
      }
    } else if (flewAwayRef.current.active && flewAwayRef.current.alpha > 0.1) {
      particlesRef.current.push({
        x: flewAwayRef.current.x - 20,
        y: flewAwayRef.current.y + 10,
        vx: -8,
        vy: 4,
        size: 5,
        alpha: flewAwayRef.current.alpha * 0.8,
        decay: 0.045,
        color: '#ef4444',
      });
    }

    // Update & draw particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size *= 0.96;

      if (p.alpha <= 0 || p.size <= 0.4) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render 8K Stunt Racing Aircraft
    if (gameStatus === 'flying') {
      ctx.save();
      ctx.translate(coords.currentX, coords.currentY);
      ctx.rotate(coords.angle);
      draw8KStuntPlane(ctx, propellerAngleRef.current, false);
      ctx.restore();
    } else if (gameStatus === 'crashed') {
      const fa = flewAwayRef.current;
      if (fa.active && fa.alpha > 0.01) {
        fa.x += fa.vx;
        fa.y += fa.vy;
        fa.vx *= 1.05;
        fa.vy *= 1.04;
        fa.alpha = Math.max(0, fa.alpha - 0.02);

        ctx.save();
        ctx.globalAlpha = fa.alpha;
        ctx.translate(fa.x, fa.y);
        ctx.rotate(fa.rotation);
        draw8KStuntPlane(ctx, propellerAngleRef.current, true);
        ctx.restore();
      }
    }
  };

  // 8K Ultra-HD Stunt Racing Biplane
  // Featuring multi-layered metallic gloss, volumetric canopy reflection, spinning propeller blades with hazard tips, and multi-stage exhaust flame
  const draw8KStuntPlane = (
    ctx: CanvasRenderingContext2D,
    propellerAngle: number,
    isZoomingAway: boolean
  ) => {
    ctx.save();
    ctx.scale(0.88, 0.88);

    // 1. Triple-Stage Afterburner Exhaust Flame
    const flameLength = isZoomingAway ? 48 + Math.random() * 18 : 28 + Math.random() * 10;

    // Stage 1: Outer Red/Magenta Flame
    ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
    ctx.beginPath();
    ctx.moveTo(-28, 5);
    ctx.lineTo(-28 - flameLength, 0);
    ctx.lineTo(-28, -5);
    ctx.closePath();
    ctx.fill();

    // Stage 2: Bright Golden Amber Mid Flame
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-28, 3.5);
    ctx.lineTo(-28 - flameLength * 0.7, 0);
    ctx.lineTo(-28, -3.5);
    ctx.closePath();
    ctx.fill();

    // Stage 3: Intense White-Hot Core Plasma
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-28, 2);
    ctx.lineTo(-28 - flameLength * 0.35, 0);
    ctx.lineTo(-28, -2);
    ctx.closePath();
    ctx.fill();

    // 2. Main Aerobatic Fuselage (8K Gloss Metallic Shading)
    ctx.shadowColor = 'rgba(244, 63, 94, 0.65)';
    ctx.shadowBlur = 14;

    const bodyGrad = ctx.createLinearGradient(0, -15, 0, 18);
    bodyGrad.addColorStop(0, '#fda4af'); // Specular highlight rose
    bodyGrad.addColorStop(0.25, '#f43f5e'); // Vibrant racing crimson
    bodyGrad.addColorStop(0.7, '#be123c'); // Rich crimson shadow
    bodyGrad.addColorStop(1, '#4c0519'); // Metallic underside
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(35, 0); // Nose front
    ctx.quadraticCurveTo(25, -11, 0, -12); // Cowling to cockpit
    ctx.lineTo(-24, -9); // Turtle deck
    ctx.lineTo(-46, -3); // Tail root
    ctx.lineTo(-46, 2.5); // Tail bottom
    ctx.lineTo(-20, 10); // Belly
    ctx.quadraticCurveTo(14, 12, 32, 4); // Lower cowl
    ctx.closePath();
    ctx.fill();

    // Fuselage top spine metallic highlight streak
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(22, -9);
    ctx.lineTo(-18, -8);
    ctx.stroke();

    // 3. Tail Vertical Stabilizer & Rudder
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.moveTo(-26, -9);
    ctx.lineTo(-45, -28); // Fin top
    ctx.lineTo(-50, -26);
    ctx.lineTo(-46, -3);
    ctx.closePath();
    ctx.fill();

    // Rudder white racing stripe
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-40, -24);
    ctx.lineTo(-44, -5);
    ctx.stroke();

    // Horizontal stabilizer
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.moveTo(-36, -2);
    ctx.lineTo(-48, -11);
    ctx.lineTo(-52, -9);
    ctx.lineTo(-44, 2);
    ctx.closePath();
    ctx.fill();

    // 4. Stunt Biplane Dual Wings
    // Lower Wing
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.moveTo(9, 6);
    ctx.lineTo(-13, 26);
    ctx.lineTo(-23, 24);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();

    // Upper Wing with 8K Aero Foil Gradient
    const upperWingGrad = ctx.createLinearGradient(0, -30, 0, 0);
    upperWingGrad.addColorStop(0, '#fecdd3');
    upperWingGrad.addColorStop(0.35, '#f43f5e');
    upperWingGrad.addColorStop(1, '#9f1239');
    ctx.fillStyle = upperWingGrad;

    ctx.beginPath();
    ctx.moveTo(20, -11);
    ctx.lineTo(5, -32); // Wingtip top
    ctx.lineTo(-20, -29); // Wingtip rear
    ctx.lineTo(-4, -9); // Wing root
    ctx.closePath();
    ctx.fill();

    // Upper wing white racing speed stripe & navigation light
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(15, -13);
    ctx.lineTo(1, -30);
    ctx.stroke();

    // Green wingtip navigation light
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#4ade80';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(3, -31, 2, 0, Math.PI * 2);
    ctx.fill();

    // Interplane Strut connecting upper & lower wings
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-2, -22);
    ctx.lineTo(-11, 18);
    ctx.stroke();

    // 5. 8K Volumetric Cockpit Bubble & Pilot Helmet
    const glassGrad = ctx.createLinearGradient(0, -12, 0, -2);
    glassGrad.addColorStop(0, '#f0f9ff');
    glassGrad.addColorStop(0.4, '#38bdf8');
    glassGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = glassGrad;

    ctx.beginPath();
    ctx.moveTo(13, -9);
    ctx.quadraticCurveTo(3, -17, -9, -13);
    ctx.lineTo(-9, -7);
    ctx.lineTo(9, -7);
    ctx.closePath();
    ctx.fill();

    // Pilot silhouette with goggles
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, -9.5, 3.8, 0, Math.PI * 2);
    ctx.fill();
    // Aviator goggles glint
    ctx.fillStyle = '#fde047';
    ctx.fillRect(1, -11, 2, 1.5);

    // Specular canopy gloss reflection
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(11, -8);
    ctx.quadraticCurveTo(2, -15, -6, -12);
    ctx.stroke();

    // 6. Engine Radial Cowl (Chrome nose cylinder)
    const cowlGrad = ctx.createRadialGradient(29, 0, 2, 29, 0, 15);
    cowlGrad.addColorStop(0, '#f43f5e');
    cowlGrad.addColorStop(0.7, '#be123c');
    cowlGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = cowlGrad;

    ctx.beginPath();
    ctx.ellipse(31, 0, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 7. Spinning Propeller Blur Ring + Dynamic Blades
    const discGrad = ctx.createRadialGradient(39, 0, 4, 39, 0, 28);
    discGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    discGrad.addColorStop(0.65, 'rgba(251, 113, 133, 0.3)');
    discGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.ellipse(39, 0, 6, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dual Propeller Blades with High-Visibility Hazard Tips
    ctx.save();
    ctx.translate(39, 0);
    ctx.rotate(propellerAngle);

    ctx.fillStyle = '#1e293b';
    // Blade 1
    ctx.beginPath();
    ctx.ellipse(0, 15, 2.6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Yellow hazard safety tip 1
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, 24, 2.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blade 2
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, -15, 2.6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Yellow hazard safety tip 2
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, -24, 2.4, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bullet Spinner Cap
    const spinnerGrad = ctx.createRadialGradient(42, -1, 1, 42, 0, 7);
    spinnerGrad.addColorStop(0, '#ffffff');
    spinnerGrad.addColorStop(0.35, '#f43f5e');
    spinnerGrad.addColorStop(1, '#881337');
    ctx.fillStyle = spinnerGrad;
    ctx.beginPath();
    ctx.ellipse(39, 0, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 8. Vintage Aerobatic Landing Gear
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(11, 9);
    ctx.lineTo(7, 22);
    ctx.stroke();

    // Tire
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(7, 22, 4.2, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crimson Hubcap
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(7, 22, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="relative h-68 sm:h-84 md:h-92 w-full overflow-hidden rounded-3xl border border-rose-950/40 bg-[#05070d] shadow-[0_0_40px_rgba(0,0,0,0.85)]">
      <canvas ref={canvasRef} className="h-full w-full block" />

      {/* 8K Ultra-HD Engine HUD Status Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-auto select-none">
        <button
          onClick={() => setQualityMode(prev => prev === '8K' ? '4K' : '8K')}
          title="ভিজ্যুয়াল কোয়ালিটি মোড"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition hover:border-amber-400 active:scale-95 cursor-pointer"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-numeric text-[11px] font-black tracking-wider text-amber-300">
            {qualityMode} ULTRA HD
          </span>
          <span className="text-[9px] text-slate-400 font-bold border-l border-slate-700 pl-1.5 hidden sm:inline">
            120 FPS RETINA
          </span>
        </button>
      </div>

      {/* Overlay Multiplier Display & Center Stage Info */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-rose-500/60 bg-black shadow-[0_0_30px_rgba(244,63,94,0.5)] p-0.5">
              <img
                src={aviatorLogo}
                alt="Aviator Pro"
                className="h-full w-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-numeric text-5xl sm:text-6xl font-black text-white tracking-wider drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
              {waitingSeconds.toFixed(1)}s
            </span>
            <div className="flex items-center gap-2 rounded-full bg-rose-500/15 border border-rose-500/30 px-3.5 py-1 text-xs font-bold text-rose-300 shadow-md">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              পরবর্তী রাউন্ডের জন্য বেট করুন
            </div>
          </div>
        )}

        {status === 'flying' && (
          <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-150">
            <span className="font-numeric text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tight drop-shadow-[0_10px_35px_rgba(0,0,0,0.95)]">
              {multiplier.toFixed(2)}x
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-950/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              <Flame className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>উড়ছে • 8K এভিয়েটর ফ্লাইট</span>
            </div>
          </div>
        )}

        {status === 'crashed' && (
          <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-90 duration-200">
            <span className="text-4xl sm:text-6xl font-black italic tracking-wider text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.95)]">
              FLEW AWAY!
            </span>
            <span className="font-numeric text-2xl sm:text-4xl font-extrabold text-slate-200 drop-shadow">
              @{multiplier.toFixed(2)}x
            </span>
            <span className="text-xs font-semibold text-slate-400 bg-black/60 px-3 py-0.5 rounded-full border border-slate-800">
              প্লেনটি আকাশে উড়ে চলে গেছে
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
