import React, { useEffect, useRef } from 'react';

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

export const AviatorCanvas: React.FC<AviatorCanvasProps> = ({
  multiplier,
  status,
  waitingSeconds,
  finalCrashMult,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Sync props to refs to decouple 60fps render loop from React state re-renderings
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
  const radarAngleRef = useRef<number>(0);
  const propellerAngleRef = useRef<number>(0);

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
    vx: 12,
    vy: -8,
    rotation: -0.35,
    alpha: 1.0,
  });

  const lastCrashMultRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let lastTime = performance.now();

    // 60FPS continuous render loop
    const render = (now: number) => {
      const dt = Math.min(40, now - lastTime);
      lastTime = now;

      if (width === 0 || height === 0) {
        animFrameId.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth visual multiplier interpolation (no jitter or discrete stepping)
      const currentStatus = statusRef.current;
      const targetMult = multiplierRef.current;

      if (currentStatus === 'waiting') {
        displayMultRef.current = 1.0;
        flewAwayRef.current.active = false;
      } else if (currentStatus === 'flying') {
        flewAwayRef.current.active = false;
        // Fast yet silky smooth catchup to target multiplier
        displayMultRef.current += (targetMult - displayMultRef.current) * 0.35;
      } else if (currentStatus === 'crashed') {
        displayMultRef.current = targetMult;
      }

      // Propeller spin
      propellerAngleRef.current += 0.55;

      // 1. Background Grid & Soft Radar
      drawBackground(ctx, width, height);

      // 2. State-specific drawing
      if (currentStatus === 'waiting') {
        drawWaitingState(ctx, width, height, waitingSecondsRef.current);
      } else {
        drawFlightScene(ctx, width, height, displayMultRef.current, currentStatus, now);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
    };
  }, []);

  // Background radar & coordinate grid lines
  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Subtle red ambient vignette from bottom-left
    const radGlow = ctx.createRadialGradient(0, h, 20, 0, h, Math.max(w, h));
    radGlow.addColorStop(0, 'rgba(225, 29, 72, 0.14)');
    radGlow.addColorStop(0.55, 'rgba(15, 23, 42, 0.45)');
    radGlow.addColorStop(1, 'rgba(5, 7, 12, 0.98)');
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, w, h);

    // Subtle coordinate grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    const gridSpacing = 44;
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

    // Sweeping radar beam
    radarAngleRef.current += 0.008;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(radarAngleRef.current);
    const beamGrad = ctx.createLinearGradient(0, 0, Math.max(w, h) * 0.7, 0);
    beamGrad.addColorStop(0, 'rgba(225, 29, 72, 0.08)');
    beamGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, Math.max(w, h) * 0.7, 0, Math.PI / 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Waiting countdown circle
  const drawWaitingState = (ctx: CanvasRenderingContext2D, w: number, h: number, seconds: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.19;

    const totalDuration = 5;
    const progress = Math.max(0, Math.min(1, (totalDuration - seconds) / totalDuration));

    ctx.save();
    // Background track ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.stroke();

    // Red progress ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#e11d48';
    ctx.lineCap = 'round';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.restore();
  };

  // Dynamic natural flight physics & curve calculation
  // Provides uniform, smooth takeoff and climb regardless of whether final multiplier is 1.1x or 100x
  const getFlightCoordinates = (
    w: number,
    h: number,
    mult: number,
    now: number
  ) => {
    const startX = 35;
    const startY = h - 35;

    // Organic exponential climb progression:
    // Starts at 0 at 1.00x, climbs rapidly initially, then transitions into high-altitude cruising
    const norm = Math.max(0, mult - 1.0);
    // Smooth mathematical progression (independent of secret crash point)
    const progress = 1 - Math.exp(-0.35 * Math.pow(norm, 0.75));

    // Calculate base climb coordinates
    const maxX = w - 110;
    const maxY = 65;
    const currentX = startX + (maxX - startX) * Math.min(progress, 0.94);
    const currentY = startY - (startY - maxY) * Math.pow(Math.min(progress, 0.94), 0.82);

    // Natural aerodynamic floating / gentle bobbing in the air
    const time = now * 0.001;
    const floatOffset = progress > 0.05 ? Math.sin(time * 3.2) * 5 + Math.cos(time * 2.1) * 3 : 0;
    const finalX = currentX;
    const finalY = currentY + floatOffset;

    // Control point for smooth cubic bezier curve
    const cpX = startX + (currentX - startX) * 0.52;
    const cpY = startY;

    // Natural tangent angle following the climb trajectory
    // Derivative approximation
    const dtProgress = 0.01;
    const nextNorm = norm + dtProgress;
    const nextProgress = 1 - Math.exp(-0.35 * Math.pow(nextNorm, 0.75));
    const nextX = startX + (maxX - startX) * Math.min(nextProgress, 0.94);
    const nextY = startY - (startY - maxY) * Math.pow(Math.min(nextProgress, 0.94), 0.82);
    
    const baseAngle = Math.atan2(nextY - currentY, nextX - currentX);
    // Add slight aerodynamic pitch oscillation
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
        // Initialize Flew Away trajectory starting from crash position
        flewAwayRef.current = {
          active: true,
          x: coords.currentX,
          y: coords.currentY,
          vx: 14,
          vy: -9,
          rotation: coords.angle - 0.2,
          alpha: 1.0,
        };
        lastCrashMultRef.current = mult;
      }
    }

    // 1. Draw glowing flight curve and area fill
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(coords.startX, coords.startY);
    ctx.quadraticCurveTo(coords.cpX, coords.cpY, coords.currentX, coords.currentY);
    ctx.lineTo(coords.currentX, coords.startY);
    ctx.lineTo(coords.startX, coords.startY);
    ctx.closePath();

    const fillGrad = ctx.createLinearGradient(0, coords.currentY, 0, coords.startY);
    fillGrad.addColorStop(0, gameStatus === 'crashed' ? 'rgba(239, 68, 68, 0.28)' : 'rgba(225, 29, 72, 0.35)');
    fillGrad.addColorStop(1, 'rgba(225, 29, 72, 0.01)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Glowing stroke curve
    ctx.beginPath();
    ctx.moveTo(coords.startX, coords.startY);
    ctx.quadraticCurveTo(coords.cpX, coords.cpY, coords.currentX, coords.currentY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = gameStatus === 'crashed' ? '#ef4444' : '#e11d48';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    // Glowing tip dot
    ctx.save();
    ctx.beginPath();
    ctx.arc(coords.currentX, coords.currentY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    // 2. Engine exhaust particles
    if (gameStatus === 'flying') {
      // Spawn fresh exhaust particles
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: coords.currentX - 22 + (Math.random() * 4 - 2),
          y: coords.currentY + 12 + (Math.random() * 4 - 2),
          vx: -(Math.random() * 3.5 + 2.0),
          vy: Math.random() * 1.5 - 0.4,
          size: Math.random() * 5 + 3,
          alpha: 0.85,
          decay: Math.random() * 0.035 + 0.025,
          color: Math.random() > 0.45 ? '#fb7185' : '#f59e0b',
        });
      }
    } else if (flewAwayRef.current.active && flewAwayRef.current.alpha > 0.1) {
      // Spawn speed streak particles during flew away
      particlesRef.current.push({
        x: flewAwayRef.current.x - 20,
        y: flewAwayRef.current.y + 10,
        vx: -6,
        vy: 3,
        size: 4,
        alpha: flewAwayRef.current.alpha * 0.8,
        decay: 0.05,
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

      if (p.alpha <= 0 || p.size <= 0.5) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Render Aircraft
    if (gameStatus === 'flying') {
      ctx.save();
      ctx.translate(coords.currentX, coords.currentY);
      ctx.rotate(coords.angle);
      drawHighQualityStuntPlane(ctx, propellerAngleRef.current, false);
      ctx.restore();
    } else if (gameStatus === 'crashed') {
      const fa = flewAwayRef.current;
      if (fa.active && fa.alpha > 0.01) {
        // Accelerate off-screen
        fa.x += fa.vx;
        fa.y += fa.vy;
        fa.vx *= 1.05;
        fa.vy *= 1.04;
        fa.alpha = Math.max(0, fa.alpha - 0.02);

        ctx.save();
        ctx.globalAlpha = fa.alpha;
        ctx.translate(fa.x, fa.y);
        ctx.rotate(fa.rotation);
        drawHighQualityStuntPlane(ctx, propellerAngleRef.current, true);
        ctx.restore();
      }
    }
  };

  // High-Definition Stunt Biplane rendering (Aerobatic vintage racing plane)
  // Replicating the authentic Aviator aircraft with spinning propeller, cowl, biplane wings, and rich shading
  const drawHighQualityStuntPlane = (
    ctx: CanvasRenderingContext2D,
    propellerAngle: number,
    isZoomingAway: boolean
  ) => {
    ctx.save();
    // Scale plane to clean, crisp proportion
    ctx.scale(0.85, 0.85);

    // 1. Aerodynamic Speed Streaks / Exhaust Fire
    const flameLength = isZoomingAway ? 40 + Math.random() * 15 : 22 + Math.random() * 8;
    // Outer flame
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-28, 4);
    ctx.lineTo(-28 - flameLength, 0);
    ctx.lineTo(-28, -4);
    ctx.closePath();
    ctx.fill();

    // Inner bright core flame
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-28, 2);
    ctx.lineTo(-28 - flameLength * 0.65, 0);
    ctx.lineTo(-28, -2);
    ctx.closePath();
    ctx.fill();

    // 2. Main Aerobatic Fuselage (Rich crimson/red with glossy metallic highlights)
    ctx.shadowColor = 'rgba(225, 29, 72, 0.6)';
    ctx.shadowBlur = 10;

    const bodyGrad = ctx.createLinearGradient(0, -14, 0, 16);
    bodyGrad.addColorStop(0, '#f43f5e'); // Top highlight rose
    bodyGrad.addColorStop(0.35, '#e11d48'); // Rich crimson
    bodyGrad.addColorStop(0.85, '#9f1239'); // Lower shadow
    bodyGrad.addColorStop(1, '#4c0519'); // Dark belly
    ctx.fillStyle = bodyGrad;

    // Fuselage contour (Nose -> Tail -> Belly)
    ctx.beginPath();
    ctx.moveTo(34, 0); // Nose front
    ctx.quadraticCurveTo(24, -10, 0, -11); // Top cowling to cockpit
    ctx.lineTo(-22, -8); // Turtle deck
    ctx.lineTo(-44, -3); // Tail root
    ctx.lineTo(-44, 2); // Tail bottom
    ctx.lineTo(-18, 9); // Lower belly
    ctx.quadraticCurveTo(12, 11, 30, 4); // Lower cowl
    ctx.closePath();
    ctx.fill();

    // 3. Tail Vertical Fin & Rudder
    ctx.fillStyle = '#be123c';
    ctx.beginPath();
    ctx.moveTo(-24, -8);
    ctx.lineTo(-42, -26); // Fin top
    ctx.lineTo(-48, -24);
    ctx.lineTo(-44, -3);
    ctx.closePath();
    ctx.fill();

    // Rudder white trim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-38, -22);
    ctx.lineTo(-42, -5);
    ctx.stroke();

    // Horizontal stabilizer
    ctx.fillStyle = '#9f1239';
    ctx.beginPath();
    ctx.moveTo(-34, -2);
    ctx.lineTo(-46, -10);
    ctx.lineTo(-50, -8);
    ctx.lineTo(-42, 2);
    ctx.closePath();
    ctx.fill();

    // 4. Stunt Biplane Wings (Double wings with struts)
    // Lower Wing
    ctx.fillStyle = '#881337';
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.lineTo(-12, 24);
    ctx.lineTo(-22, 22);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();

    // Upper Wing (Dominant, angled aerobatic wing)
    const upperWingGrad = ctx.createLinearGradient(0, -28, 0, 0);
    upperWingGrad.addColorStop(0, '#fb7185');
    upperWingGrad.addColorStop(0.5, '#e11d48');
    upperWingGrad.addColorStop(1, '#be123c');
    ctx.fillStyle = upperWingGrad;

    ctx.beginPath();
    ctx.moveTo(18, -10);
    ctx.lineTo(4, -30); // Wingtip top
    ctx.lineTo(-18, -27); // Wingtip rear
    ctx.lineTo(-4, -8); // Wing root
    ctx.closePath();
    ctx.fill();

    // Upper wing white racing speed stripe
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(14, -12);
    ctx.lineTo(0, -28);
    ctx.stroke();

    // Interplane Strut connecting upper & lower wings
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, -20);
    ctx.lineTo(-10, 16);
    ctx.stroke();

    // 5. Cockpit Canopy (Bubble windshield with glossy reflective glass)
    const glassGrad = ctx.createLinearGradient(0, -11, 0, -2);
    glassGrad.addColorStop(0, '#e0f2fe');
    glassGrad.addColorStop(0.5, '#38bdf8');
    glassGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = glassGrad;

    ctx.beginPath();
    ctx.moveTo(12, -8);
    ctx.quadraticCurveTo(2, -15, -8, -12);
    ctx.lineTo(-8, -6);
    ctx.lineTo(8, -6);
    ctx.closePath();
    ctx.fill();

    // Canopy specular highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.quadraticCurveTo(2, -13, -5, -11);
    ctx.stroke();

    // 6. Vintage Radial Engine Cowl (Front circular cylinder)
    const cowlGrad = ctx.createRadialGradient(28, 0, 2, 28, 0, 14);
    cowlGrad.addColorStop(0, '#e11d48');
    cowlGrad.addColorStop(0.7, '#be123c');
    cowlGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = cowlGrad;

    ctx.beginPath();
    ctx.ellipse(30, 0, 8, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 7. Classic Aerobatic Propeller (High speed spinning motion blur disc + 2 dynamic blades)
    // Translucent propeller disc blur
    const discGrad = ctx.createRadialGradient(38, 0, 4, 38, 0, 26);
    discGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    discGrad.addColorStop(0.65, 'rgba(251, 113, 133, 0.25)');
    discGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.ellipse(38, 0, 5, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spinning propeller blades
    ctx.save();
    ctx.translate(38, 0);
    ctx.rotate(propellerAngle);

    ctx.fillStyle = '#1e293b';
    // Blade 1
    ctx.beginPath();
    ctx.ellipse(0, 14, 2.4, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Yellow safety tip 1
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, 23, 2.2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blade 2
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, -14, 2.4, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    // Yellow safety tip 2
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, -23, 2.2, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Red Chrome Nose Spinner (Bullet cone at propeller center)
    const spinnerGrad = ctx.createRadialGradient(40, -1, 1, 40, 0, 6);
    spinnerGrad.addColorStop(0, '#ffffff');
    spinnerGrad.addColorStop(0.3, '#f43f5e');
    spinnerGrad.addColorStop(1, '#881337');
    ctx.fillStyle = spinnerGrad;
    ctx.beginPath();
    ctx.ellipse(38, 0, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 8. Classic Vintage Landing Gear (Wheel & Aerodynamic Strut)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(6, 20); // Strut
    ctx.stroke();

    // Wheel tire
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(6, 20, 3.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Wheel Hubcap
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(6, 20, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#07090e] shadow-2xl">
      <canvas ref={canvasRef} className="h-full w-full block" />

      {/* Overlay Multiplier Display & Center Stage Info */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none">
        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in duration-300">
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-2xl overflow-hidden border-2 border-rose-500/60 bg-black shadow-[0_0_25px_rgba(225,29,72,0.4)]">
              <img 
                src="/logo.jpg" 
                alt="Aviator" 
                className="h-full w-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <span className="font-numeric text-4xl sm:text-5xl font-extrabold text-white tracking-wider">
              {waitingSeconds.toFixed(1)}s
            </span>
            <div className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              পরবর্তী রাউন্ডের জন্য বেট করুন
            </div>
          </div>
        )}

        {status === 'flying' && (
          <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-150">
            <span className="font-numeric text-6xl sm:text-7xl font-black text-white tracking-tight drop-shadow-[0_8px_25px_rgba(0,0,0,0.9)]">
              {multiplier.toFixed(2)}x
            </span>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20 shadow">
              উড়ছে • উঁচুতে উঠছে
            </span>
          </div>
        )}

        {status === 'crashed' && (
          <div className="flex flex-col items-center gap-1.5 animate-in zoom-in-90 duration-200">
            <span className="text-4xl sm:text-5xl font-black italic tracking-wide text-rose-500 drop-shadow-[0_0_25px_rgba(225,29,72,0.85)]">
              FLEW AWAY!
            </span>
            <span className="font-numeric text-2xl sm:text-3xl font-extrabold text-slate-300">
              @{multiplier.toFixed(2)}x
            </span>
            <span className="text-xs font-medium text-slate-400">
              প্লেনটি উড়ে চলে গেছে
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
