'use client';

import React, { useRef, useState, useEffect } from "react";

export default function RandomBlobGenerator() {
  const defaultState = {
    seed: Math.floor(Math.random() * 1e9),
    points: 5,
    randomness: 0.15,
    size: 600, // increased canvas size
    colorA: "#7f5af0",
    colorB: "#00d4ff",
    controlsOpen: false,
    fadeCycles: 8,
    fadeCycleDuration: 15000,
    shrinkRatio: 0.7,
    growRatio: 0.8,
  };

  const [seed, setSeed] = useState(defaultState.seed);
  const [points] = useState(defaultState.points);
  const [randomness] = useState(defaultState.randomness);
  const [size] = useState(defaultState.size);
  const [colorA, setColorA] = useState(defaultState.colorA);
  const [colorB, setColorB] = useState(defaultState.colorB);
  const [seededBlob, setSeededBlob] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(defaultState.controlsOpen);
  const [blobScale, setBlobScale] = useState(1);
  const [blobOpacity, setBlobOpacity] = useState(1);
  const [fadeCycles, setFadeCycles] = useState(defaultState.fadeCycles);
  const [fadeCycleDuration, setFadeCycleDuration] = useState(defaultState.fadeCycleDuration);
  const [shrinkRatio, setShrinkRatio] = useState(defaultState.shrinkRatio);
  const [growRatio, setGrowRatio] = useState(defaultState.growRatio);

  const svgRef = useRef(null);

  function mulberry32(a: number) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generatePoints(seedVal: number, count: number, rad: number, jitter: number) {
    const rng = mulberry32(seedVal);
    const pts = [];
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const lowFreq = 0.7 + 0.3 * rng();
      const r = rad * (lowFreq + (rng() - 0.5) * jitter * 2);
      pts.push([Math.cos(theta) * r, Math.sin(theta) * r]);
    }
    return pts;
  }

  function catmullRom2bezier(points: number[][]) {
    const d = points;
    const size = d.length;
    if (size < 2) return "";
    const get = (i: number) => d[(i + size) % size];

    let path = "";
    const p0 = get(0);
    path += `M ${p0[0].toFixed(2)} ${p0[1].toFixed(2)}`;

    for (let i = 0; i < size; i++) {
      const pCurrent = get(i);
      const pNext = get(i + 1);
      const pPrev = get(i - 1);
      const pNext2 = get(i + 2);

      const control1x = pCurrent[0] + (pNext[0] - pPrev[0]) / 6;
      const control1y = pCurrent[1] + (pNext[1] - pPrev[1]) / 6;
      const control2x = pNext[0] - (pNext2[0] - pCurrent[0]) / 6;
      const control2y = pNext[1] - (pNext2[1] - pCurrent[1]) / 6;

      path += ` C ${control1x.toFixed(2)} ${control1y.toFixed(2)}, ${control2x.toFixed(2)} ${control2y.toFixed(2)}, ${pNext[0].toFixed(2)} ${pNext[1].toFixed(2)}`;
    }

    path += " Z";
    return path;
  }

  function chaikin(points: number[][], iterations = 2) {
    let pts = points.map((p) => p.slice());
    for (let it = 0; it < iterations; it++) {
      const newPts: number[][] = [];
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const p0 = pts[i];
        const p1 = pts[(i + 1) % n];
        const q = [p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25];
        const r = [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75];
        newPts.push(q, r);
      }
      pts = newPts;
    }
    return pts;
  }

  const buildPath = React.useCallback((seedVal: number) => {
    const rad = size / 2 - 10;
    const raw = generatePoints(seedVal, points, rad, randomness);
    const smooth = chaikin(raw, 2);
    return catmullRom2bezier(smooth);
  }, [size, points, randomness]);

  useEffect(() => {
    setSeededBlob(buildPath(seed));
  }, [seed, buildPath]);

  // Convert HSL to RGB
  function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    h /= 360;
    s /= 100;
    l /= 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (0 <= h && h < 1/6) {
      r = c; g = x; b = 0;
    } else if (1/6 <= h && h < 2/6) {
      r = x; g = c; b = 0;
    } else if (2/6 <= h && h < 3/6) {
      r = 0; g = c; b = x;
    } else if (3/6 <= h && h < 4/6) {
      r = 0; g = x; b = c;
    } else if (4/6 <= h && h < 5/6) {
      r = x; g = 0; b = c;
    } else if (5/6 <= h && h < 1) {
      r = c; g = 0; b = x;
    }
    
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  
  // Convert RGB to hex
  function rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  
  function getRandomColorPair() {
    // Generate base hue (0-360)
    const baseHue = Math.random() * 360;
    
    // Generate hue difference between 20-40 degrees
    const hueDifference = 40 + Math.random() * 40; // 20-40 degrees
    
    // Determine which color gets the base hue and which gets the offset
    const firstHue = baseHue;
    const secondHue = (baseHue + hueDifference) % 360;
    
    // Generate saturation (30-70% to avoid oversaturation)
    const saturation = 30 + Math.random() * 40; // 30-70%
    
    // Generate lightness (40-80% for good contrast)
    const lightness = 40 + Math.random() * 40; // 40-80%
    
    // Create both colors with same saturation and lightness for harmony
    const [r1, g1, b1] = hslToRgb(firstHue, saturation, lightness);
    const [r2, g2, b2] = hslToRgb(secondHue, saturation, lightness);
    
    return {
      colorA: rgbToHex(r1, g1, b1),
      colorB: rgbToHex(r2, g2, b2)
    };
  }

  function handleNewBlob() {
    setSeed(Math.floor(Math.random() * 1e9));
    const { colorA: newColorA, colorB: newColorB } = getRandomColorPair();
    setColorA(newColorA);
    setColorB(newColorB);
    setBlobScale(1);
    setBlobOpacity(1);
  }

  function handleFadeAway() {
    let cycle = 0;
    let currentScale = 1;

    function nextCycle() {
      if (cycle >= fadeCycles) {
        setBlobOpacity(0);
        return;
      }

      const shrink = currentScale * shrinkRatio;
      const grow = currentScale * growRatio;
      const newOpacity = 1 - (cycle + 1) / fadeCycles;

      setBlobScale(shrink);
      setBlobOpacity(newOpacity);

      setTimeout(() => {
        setBlobScale(grow);
        currentScale = grow;
        cycle++;
        setTimeout(nextCycle, fadeCycleDuration / fadeCycles / 2);
      }, fadeCycleDuration / fadeCycles / 2);
    }

    nextCycle();
  }

  return (
    <div className="p-2 sm:p-4 max-w-3xl mx-auto text-center">
      <div className="w-full max-w-[600px] aspect-square relative mx-auto">
        <svg
          ref={svgRef}
          viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorA} />
              <stop offset="100%" stopColor={colorB} />
            </linearGradient>
            <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.5" />
            </filter>
          </defs>

          <g style={{ transform: `scale(${blobScale})`, opacity: blobOpacity, transition: `transform ${fadeCycleDuration / fadeCycles / 2}ms ease-in-out, opacity ${fadeCycleDuration / fadeCycles / 2}ms linear` }}>
            <path d={seededBlob || ""} fill="url(#g1)" filter="url(#blur)" />
          </g>
        </svg>
      </div>

      <div className="mt-2 sm:mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
        <button className="btn px-3 sm:px-4 py-2 rounded shadow bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-sm sm:text-base" onClick={handleNewBlob}>
          New Blob
        </button>
        <button className="btn px-3 sm:px-4 py-2 rounded shadow bg-[#22d3ee] text-white text-sm sm:text-base" onClick={handleFadeAway}>
          Fade Away
        </button>
        <button className="btn px-3 sm:px-4 py-2 rounded shadow border text-sm sm:text-base" onClick={() => setControlsOpen((o) => !o)}>
          {controlsOpen ? "Hide Controls" : "Show Controls"}
        </button>
      </div>

      {controlsOpen && (
        <div className="mt-4 p-3 sm:p-4 border rounded-md text-left w-full max-w-md mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Fade Cycles</label>
              <input 
                type="number" 
                min={1} 
                value={fadeCycles} 
                onChange={e => setFadeCycles(Number(e.target.value))} 
                className="w-full p-2 border rounded text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Cycle Duration (ms)</label>
              <input 
                type="number" 
                min={100} 
                value={fadeCycleDuration} 
                onChange={e => setFadeCycleDuration(Number(e.target.value))} 
                className="w-full p-2 border rounded text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Shrink Ratio</label>
              <input 
                type="number" 
                step={0.01} 
                min={0} 
                max={1} 
                value={shrinkRatio} 
                onChange={e => setShrinkRatio(Number(e.target.value))} 
                className="w-full p-2 border rounded text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Grow Ratio</label>
              <input 
                type="number" 
                step={0.01} 
                min={0} 
                max={1} 
                value={growRatio} 
                onChange={e => setGrowRatio(Number(e.target.value))} 
                className="w-full p-2 border rounded text-sm" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
