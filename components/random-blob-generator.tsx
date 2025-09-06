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
  const [seededBlob, setSeededBlob] = useState(null);
  const [controlsOpen, setControlsOpen] = useState(defaultState.controlsOpen);
  const [blobScale, setBlobScale] = useState(1);
  const [blobOpacity, setBlobOpacity] = useState(1);
  const [fadeCycles, setFadeCycles] = useState(defaultState.fadeCycles);
  const [fadeCycleDuration, setFadeCycleDuration] = useState(defaultState.fadeCycleDuration);
  const [shrinkRatio, setShrinkRatio] = useState(defaultState.shrinkRatio);
  const [growRatio, setGrowRatio] = useState(defaultState.growRatio);

  const svgRef = useRef(null);

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function generatePoints(seedVal, count, rad, jitter) {
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

  function catmullRom2bezier(points) {
    const d = points;
    const size = d.length;
    if (size < 2) return "";
    const get = (i) => d[(i + size) % size];

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

  function chaikin(points, iterations = 2) {
    let pts = points.map((p) => p.slice());
    for (let it = 0; it < iterations; it++) {
      const newPts = [];
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

  const buildPath = React.useCallback((seedVal) => {
    const rad = size / 2 - 10;
    const raw = generatePoints(seedVal, points, rad, randomness);
    const smooth = chaikin(raw, 2);
    return catmullRom2bezier(smooth);
  }, [size, points, randomness]);

  useEffect(() => {
    setSeededBlob(buildPath(seed));
  }, [seed, buildPath]);

  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  function handleNewBlob() {
    setSeed(Math.floor(Math.random() * 1e9));
    setColorA(getRandomColor());
    setColorB(getRandomColor());
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
    <div className="p-6 max-w-3xl mx-auto text-center">
      <div className="w-[600px] h-[600px] relative mx-auto">
        <svg
          ref={svgRef}
          viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
          width={size}
          height={size}
          xmlns="http://www.w3.org/2000/svg"
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

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn px-4 py-2 rounded shadow bg-gradient-to-r from-indigo-500 to-cyan-400 text-white" onClick={handleNewBlob}>
          New Blob
        </button>
        <button className="btn px-4 py-2 rounded shadow bg-[#22d3ee] text-white" onClick={handleFadeAway}>
          Fade Away
        </button>
        <button className="btn px-4 py-2 rounded shadow border" onClick={() => setControlsOpen((o) => !o)}>
          {controlsOpen ? "Hide Controls" : "Show Controls"}
        </button>
      </div>

      {controlsOpen && (
        <div className="mt-4 p-4 border rounded-md text-left inline-block">
          <label className="block text-xs font-medium">Fade Cycles</label>
          <input type="number" min={1} value={fadeCycles} onChange={e => setFadeCycles(Number(e.target.value))} className="input input-sm p-2" />

          <label className="block text-xs font-medium mt-2">Cycle Duration (ms)</label>
          <input type="number" min={100} value={fadeCycleDuration} onChange={e => setFadeCycleDuration(Number(e.target.value))} className="input input-sm p-2" />

          <label className="block text-xs font-medium mt-2">Shrink Ratio</label>
          <input type="number" step={0.01} min={0} max={1} value={shrinkRatio} onChange={e => setShrinkRatio(Number(e.target.value))} className="input input-sm p-2" />

          <label className="block text-xs font-medium mt-2">Grow Ratio</label>
          <input type="number" step={0.01} min={0} max={1} value={growRatio} onChange={e => setGrowRatio(Number(e.target.value))} className="input input-sm p-2" />
        </div>
      )}
    </div>
  );
}
